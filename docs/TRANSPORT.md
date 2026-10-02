# EGO ulaşım bağlantısı

Keşfet, hizmet detayı ve harita kartındaki **Nasıl giderim?** düğmesi `/transport/[id]` ekranını açar. Başlangıç konumu isteğe bağlıdır. Yol/aktarma hesaplama Google Haritalar'a devredilir; KentPusula hat uydurmaz. Ad/numara durak araması çevrimdışıdır. Hat listesi, sefer tarifesi, sıralı güzergâh durakları ve canlı durak sorgusu native uygulamada doğrudan resmî EGO servislerinden, web'de Node adaptöründen gelir.

## Yerel çalıştırma

```powershell
npm ci
npm run transport:server
# Başka bir terminalde:
npm run web
# Telefon için:
npm start
```

Adaptör `0.0.0.0:8787` üzerinde dinler. Web, önizlemenin ana bilgisayarını kullanır. Android/iOS EGO sorguları varsayılan olarak doğrudan HTTPS üzerinden yapılır; EGO bağlantısı için bilgisayarda proxy çalıştırmak gerekmez. Expo Go geliştirme oturumu için telefon ve bilgisayar aynı ağda olmalıdır. `.env.local` içindeki `EXPO_PUBLIC_TRANSPORT_API_URL` tüm platformlarda isteğe bağlı ortak proxy seçer. Hiçbir anahtar gerekmez. Konum bu adaptöre gönderilmez; yalnızca kullanıcı yol tarifi düğmesine bastığında dış harita bağlantısında kullanılır.

## HTTP sözleşmesi

| Yol                            | Sonuç                                                | Önbellek  |
| ------------------------------ | ---------------------------------------------------- | --------- |
| `GET /health`                  | Adaptörün çalıştığı bilgisi; EGO sağlığı iddiası yok | Yok       |
| `GET /v1/lines`                | `{data: [{code,name}], fetchedAt, source}`           | 1 saat    |
| `GET /v1/lines/481/schedule`   | Ad, kalkış/varış, 3 gün türü ve sıralı duraklar      | 15 dakika |
| `GET /v1/stops/10940/arrivals` | Canlı/planlı/bilinmeyen durum ayrımlı araç kayıtları | 20 saniye |

Upstream 12 saniyede, istemci 16 saniyede zaman aşımına uğrar. İstemci ekran değişiminde isteği iptal eder; geç gelen sonuç başka hat/durağa yazılmaz. Sunucu en fazla 200 önbellek kaydı ve 8 ayrı uçuş halindeki istek tutar; aynı istek birleştirilir. Başarısız yanıt başarılı veri gibi saklanmaz. Genel URL proxy'si yoktur; yalnızca EGO HTTPS adresleri kullanılır ve yönlendirmeler reddedilir. İstemci JSON şemasını da doğrular.

## Gerçekte kullanılan kaynaklar

- Hat listesi: `GET https://www.ego.gov.tr/HareketSaatleri`, `name="hat_no1"` otobüs seçimi. 01.10.2026 testinde **659** hat okundu. EGO Mac'in eski `/AjaxData/HatListesiOtobus` adresi bu kontrolde 404 verdi.
- Tarife ve duraklar: aynı adrese form POST, `hat_no1=481`. Testte **102** güzergâh durağı ve **36** hafta içi kalkış ayrıştırıldı. Bunlar hat başlangıç saatleridir; ara durağa varış değildir. Özel başlangıç ve saat notları korunur.
- Canlı araç: `https://egocptsrvand.ego.gov.tr/mblSrv14/service.asp?FNC=Otobusler&VER=3.1.0&LAN=tr&DURAK=10940`. 01.10.2026 ilk testinde DNS/erişim başarısızdı. Sonraki testte **10940** için 6 kayıt başarıyla geldi: 1 güncel araç tahmini ve 5 planlı/bilgilendirme kaydı. Tarayıcıda 481 hattının **28 dakika** tahmini 23:08:04 alınma zamanı ile görüldü. Bu değer geçmiş test kanıtıdır, güncel yolculuk tavsiyesi değildir. Kesintilerde **503 / canlı servise ulaşılamıyor** durumuna geçilir.
- Planlı kayıt (`arac_no="-"`) canlı araç sayılmaz. Geçmiş araçlar ve `saniye >= 999000` gösterilmez. Eksik/5 dakikadan eski araç konum zamanı ETA üretmez; zaman Ankara UTC+3 olarak çözülür. Gösterilen tahmin son alınan değerdir, kullanıcı yenileyebilir.
- Çevrimdışı durak dizini: EGO Mac içindeki 02.05.2026 OSM anlık görüntüsü, 2.943 ad/numara. Dosyada koordinat olmadığı için yakın durak veya otomatik aktarma iddiası yoktur. Lisans: ODbL. Dosya: `data/transport/stops.json`.

## Yayına hazırlık

0.3.0 Android/iOS istemcisi `services/egoDirect.ts` ile resmî HTTPS adreslerine doğrudan bağlanır. Proxy yalnızca web veya isteğe bağlı ortak servis için gerekir. Native pakette localhost bağımlılığı yoktur.

`data/transport/access.json`: 41 hedef / 42 hizmet eşleşmesi, 73 durak kaydı ve 565 hat–durak ilişkisi. Yakın duraklar 02.10.2026 OpenStreetMap sorgusuyla bulunmuş, hatların o durağa uğraması resmî EGO güzergâh tablosuyla kontrol edilmiştir. Başlangıç noktasına göre otomatik aktarma hesaplaması değildir; tam rota dış navigasyonda açılır. Yakınlık kuş uçuşudur.

`data/transport/accessPoints.json` yayımlanmış ABB harita bağlantılarının ortak koordinat kaynağıdır. `services/destinationPoint.ts` bu noktaları katalogun son adımında yeni nesneler olarak uygular: harita, mesafe hesabı ve yol tarifi aynı `services` koordinatlarını tüketir. Anıttepe/Sıhhiye/Gazi adres pinleri kesin; İzmir 2 Caddesi bağlantısı sokak düzeyinde olduğu için yaklaşık kalır. 100. Yıl kütüphane/yemek hizmetleri aynı yaklaşık noktayı paylaşır. Koordinat düzeltmesi hizmet saatlerini, kontenjanını, `sourceStatus`, `sourceCheckedAt` veya `verifiedAt` alanlarını yeniden doğrulanmış saymaz.

## Kontrollü ulaşım verisi yenileme

Yenileme betiği mevcut otomatik üretilmiş hedefleri de tekrar hesaplar. Elle araştırılmış duyuru ve raylı sistem kayıtlarını korur. Yeni kanıtlar `*.evidence.json` içinde gerçek `fetchedAt` ile saklanır; eski tarihsiz HTML/JSON dosyaları güncel kanıt sayılmaz. Varsayılan TTL 24 saat, ağ istek bütçesi 25'tir. `--refresh` TTL'yi atlar; istek bütçesini aşmaz. Tüm indeksin tek çalıştırmada tazelendiği iddia edilmez. Büyük hedefleri `--target` ile seçip gerekirse bütçeyi en fazla100'e yükselt.

```powershell
# Tek hedefin resmî kanıtlarını yeniden oku:
npx tsx scripts/syncDestinationAccess.ts --refresh --target=food-anittepe --max-requests=25
# Bir hedef grubu; önbelleğin kaynak tarihleri korunur:
npx tsx scripts/syncDestinationAccess.ts --target=food-sihhiye,food-gazi --ttl-hours=24 --max-requests=100
# Mevcut zaman damgalı kanıtlardan ağ kullanmadan derle:
npx tsx scripts/syncDestinationAccess.ts --offline --max-requests=0
```

İlk iki konumsal argüman OSM snapshotı ve kanıt klasörü yoludur; varsayılanları `../../work/ego-osm-stops.json` ve `../../work/ego-access-evidence`. `--manifest=...` farklı çıktı seçer. Bir tarifeyi veya durağı doğrulama başarısız olursa o hedefin eski doğrulanmış kaydı ve tarihi korunur. Eksik OSM kapsaması eski hedefi silmez. Yenilenen hedefin `checkedAt` tarihi, dayandığı OSM/konum/durak/tarife kanıtlarının en eski tarihidir; eski önbellek bugünün tarihiyle etiketlenmez. `rebuiltAt` yalnız dosyanın derlenme zamanını gösterir. Çıktı aynı dizindeki geçici dosyadan atomik olarak değiştirilir; yarım JSON yayımlanmaz. Rapor eksiksiz hesaplanan hedef sayısını ve kullanılan ağ isteği sayısını verir.

Node adaptörünü HTTPS sağlayan bir sunucuya yerleştir ve istemci URL'sini EAS ortamında ayarla. HTTPS yalnızca üretim istemcisinde zorunludur; geliştirmede LAN HTTP desteklenir. `ALLOWED_ORIGIN` ile web kökenini sınırla. Proxy'nin önünde trafik limiti, izleme ve servis değişikliği alarmı ekle. Belediyenin kullanım şartları/servis sürekliliği için resmî entegrasyon görüşmesi ayrıca yapılmalı. Bu teslim bir resmî EGO API anlaşması veya dağıtılmış sunucu içermez.

EgoPy incelendi; eski HTTP/IP adresleri mobil uygulamaya alınmadı ve kodu kopyalanmadı. EGO Mac macOS uygulaması doğrudan paket olarak çalıştırılmadı; veri sözleşmeleri Expo/TypeScript katmanına uyarlandı. [Atıflar](../THIRD_PARTY_NOTICES.md).
