# KentPusula mimarisi

Expo SDK 57, Expo Router, React Native, React ve strict TypeScript. Aynı React Native bileşenleri Android, iOS ve web üzerinde çalışır. Beş ana sekme, hizmet detayı ve ayarlar Expo Router ile URL/deep link destekli ekranlara açılır. `src/app/` dosyaları ince route adaptörleridir; ekran ve iş mantığı route klasörü dışında tutulur.

## Katmanlar

- `features/`: Ekranlar; Home, Onboarding, Discover, Compass, Detail, MapScreen, Saved, Settings, Transport.
- `components/`: Tipografi, dokunma bileşenleri, ihtiyaç girişi, kaynaklı hizmet kartı, SVG marka çizimi ve harita.
- `services/`: Repository, ihtiyaç ayrıştırıcısı, uygunluk değerlendirmesi, zaman bütçeli rota planlama; ulaşım ve ses arayüzleri.
- `data/`: 86 kaynaklı hizmet/branş kaydı; 50 tanesi haritada gösterilir. `places.json` yeni 36 belediye konumunun alan bazlı kaynağını taşır. `data/transport/stops.json` ODbL lisanslı, çevrimdışı durak ad/numara dizinidir.
- `hooks/`: Context üzerinden küçük uygulama durumu; AsyncStorage üzerinde sürümlü profil/tercih/kayıtlar. Konum kalıcı kayda girmez.
- `types/`: Hizmet, profil, ihtiyaç, uygunluk, plan ve kayıt sözleşmeleri.
- `theme/`: Açık/koyu palet, büyük metin ve yüksek kontrast.
- `utils/`: Ankara saati, bağlantı açma ve hata yönetimi.

## Güven sınırları

Kaynak okuma tarihi, saha doğrulaması değildir. Bu nedenle `sourceCheckedAt` ile `verifiedAt` ayrıdır; tüm kayıtlarda saha doğrulaması bilinmiyor. Bilinmeyen saat, yaş veya başvuru koşulu olumlu gerçek gibi gösterilmez. Katalogda sahte mekân bulunmaz; eski duyurular tarihsel kaynak etiketi taşır. Önceki 14 hizmet koordinatı yaklaşık gösterimdir. Yeni 36 koordinat resmî belediye haritalarından alınır; saha doğrulaması iddiası yoktur. Ücreti belirtilmeyen yeni hizmetler `isFree: null` taşır ve ücretsiz etiketi almaz.

Yerel `IntentProvider` sadece kullanıcının ihtiyacını sınıflandırır. `createPlan` yalnızca repository'deki kimlikleri kullanır; yeni hizmet yazamaz. Öğrenci olmadığını açıkça belirten kullanıcılara öğrenci hizmetleri önerilmez. Bilinmeyen uygunluk şartları uyarıdır. Güncel saatleri bilinmeyen hizmetler gerçek zaman modunda plana alınmaz. Başvuru gerekli hizmetlerde kabul/kapasite garantisi verilmez.

## Entegrasyon noktaları

`ServiceRepository`: Kimlik tabanlı detay, sayfalanan API ve offline cache eklenebilir. Mevcut 86 kayıt hafif bir yerel paket içindedir; gerçek backend için sunucu tarafında doğrulama, güncellik politikası ve denetim kaydı gerekir.

`IntentProvider`: İleride yalnızca yaş, öğrenci durumu, kategoriler, zaman bütçesi ve hedef günü döndüren şema doğrulamalı bir sunucu API'si bağlanabilir. Mobil pakette API anahtarı bulunmamalıdır. Kaynak dışı serbest metin cevapları hizmet verisi olarak kullanılamaz.

`egoProvider`: Cihazdan Node HTTP adaptörüne bağlanır. `server/ego.ts` resmî EGO HTML/JSON verisini ayrıştırır; `server/index.ts` izinli yolları, zaman aşımını, sınırlı önbelleği ve eşzamanlı istek birleştirmeyi yönetir. İstek parametreleri doğrulanır. Sefer tarifesi ile canlı araç bilgisi ayrıdır; eski/bilinmeyen araç zamanı dakika tahminine dönüşmez. Detaylar `TRANSPORT.md` içinde.

`VoiceProvider`: Şimdiki provider kayıt almaz, kullanıcının seçtiği demo isteğini döndürür. Gerçek konuşma tanıma sağlayıcısı için izin, durdurma/iptal, hata ve zaman aşımı işlemleri gerekir. Sesli okuma expo-speech üzerinden gerçek cihaz desteğini kullanır.

## Bilinen sınırlar

Saatler aynı gün içindeki aralıkları destekler; gece yarısını aşan aralıklar iki gün olarak saklanmalıdır. Resmî tatil istisnaları, doluluk ve başvuru kabulü henüz yok. Rota yürüme tahmini ve zaman bütçesi içerir; yolları, engelli erişim rotasını veya canlı toplu taşımayı hesaplamaz. Harita pan/zoom düğmeleri vardır; native harita jestleri ve çevrimdışı tile paketi yoktur. Web ilk açılışı internet gerektirir; yerel uygulamada seed/kayıtlar çevrimdışı erişilebilir.
