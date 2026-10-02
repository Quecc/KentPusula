# Doğrulama notları

## 02.10.2026 / 0.3.0

### Akış ve doğruluk revizyonu

- 35 test geçti; son TypeScript ve lint temiz. Android/iOS/web dışa aktarımı tamamlandı. Harita köprüsünün seçim/filtre/merkezleme sırasında tek haritayı ve yakınlaştırmayı koruması VM davranış testleriyle kontrol edildi.
- Gerçek saat varsayılan; eski sürüm 1/2 sunum varsayılanı bir kez kapatılıyor. Kullanıcı sonradan sunum açarsa sekmelerde ve hizmet detayında görünür etiket var. Ulaşım günleri ve kalan kalkışlar Ankara saatine göre; 23.30 ve UTC geceyarısı geçişleri test edildi.
- Durak sorgusu önplanda 30 saniyede bir yenilenir. Aynı durakta 60 saniyeden yeni sonuç yenileme boyunca korunur; hata veya 60 saniye sınırında eski dakika gizlenir. Arka plandan dönüş isteğin kimliğini değiştirir; eski yanıt görünmez.
- Anıttepe/Sıhhiye/Gazi için resmî ABB koordinatları artık harita, mesafe, yol tarifi ve katalog tüketicilerinde ortak. İzmir 2 ve ilişkili çalışma alanı yaklaşık konum olarak kalır. Konum kanıtı hizmetin açılış/ücretsiz/başvuru güncellik statüsünü değiştirmez.
- EGO yenileme betiği TTL, hedef filtresi, sınırlı istek bütçesi ve atomik çıktı kullanır; başarısız yenilemede eski hedef korunur. Eski kanıt yeni günün tarihiyle etiketlenmez. Mevcut 41 hedef / 565 ilişki yeniden canlı taranmadı; kontrollü örneklerle yenileme davranışı test edildi.
- 390 × 844 telefon boyutunda büyük metinle ana ekran → Yemek bul → Anıttepe → Ulaşım → Hat akışı açıldı; seçimin ardından yükleme/sonuç aynı bağlamda görünür. Ana ekran görüntüsü: `home-refined.jpg`.
- Gerçek EGO denemesinde ilk tarife/hat listesi isteği hata verdi; bağımsız native adaptör kontrolünde 167 tarifesi ve 13123 araç yanıtı ardından başarılı geldi. Bu, servisin kesintisizliği veya fiziksel Android ağ testi değildir.
- Tarayıcıda 167 tarifesi sonrasında açıldı; 13.00 sonrası kalkışlar önde, geçmiş sabah saatleri kısa listede yoktu. 13123 ekranındaki güncelleme zamanı elle yenilemeden 12:26:47 → 12:27:17 oldu. Bu saatler yalnız test kanıtıdır.
- Sade Keşfet telefon görünümünde doğrulandı; arama/kategori ve ilk sonuç Filtreler kapalıyken önde. Görüntü: `discover-refined.jpg`; durak paneli: `stop-refined.jpg`.
- EAS oturum onayı hâlâ bekliyor; USB cihaz listesi boş. APK bağlantısı ve gerçek telefon kabul testi tamamlanmadı.

### Önceki aynı sürüm kontrolleri

- 24 test, TypeScript ve lint geçti. Expo Doctor: 21/21.
- Son ulaşım verisiyle Android, iOS ve web dışa aktarımı tamamlandı.
- Telefonda kullanılacak Leaflet HTML'si tarayıcıda gerçek OpenStreetMap zeminiyle açıldı; görüntü: `map-0.3.0.jpg`. Bu kontrol fiziksel Android WebView testi değildir.
- Cumhurbaşkanlığı araması Millet Kütüphanesi'ni buluyor. 167 hattının resmî sefer tarifesi ve 13123 canlı durak sorgusu çalıştı; test anında canlı araç yok, iki planlı kayıt ayrı ve kapalı gösterildi.
- Native doğrudan EGO adaptörü ayrıca gerçek uç noktalarla kontrol edildi: 659 hat, 167 için 18 durak, 13123 için iki kayıt. Bu test Node üzerinde yapıldı; Android ağ testi değildir.
- 41 hedef / 42 hizmet eşleşmesi; yakın duraklar ve resmî EGO tarifesi kaynaklı 565 hat–durak ilişkisi. Mesafeler kuş uçuşudur, kişiye özel aktarma hesaplanmaz.
- EAS tarayıcı girişi başlatıldı; hesap onayı bekleniyor. İmzalı APK henüz üretilmedi. USB cihaz listesi boş; telefon üzerinde son doğrulama bekliyor.

## 01.10.2026 / 0.2.0

## Otomatik kontroller

- 20 test geçti. Önceki 14 eşleştirme/zaman/uygunluk testi korundu; katalog testi 86 kayıt ve 50 harita hizmeti için güncellendi. Konumsuz kurs testi yalnızca konumsuz kayıtları kullanır.
- Ulaşım testleri: Türkçe HTML çözümü, hat varyantları, not içindeki saatin yanlış kalkış sayılmaması, sıralı duraklar, planlı/geçmiş/bilinmeyen araçlar, eski konumdan ETA üretmeme, 36 yeni koordinatın kaynak/bölge/benzersizlik kontrolü ve 2.943 durak kimliği.
- Strict TypeScript ve tüm ağaç ESLint geçti.
- Expo Doctor: 21/21 kontrol geçti.
- Web, Android ve iOS JS/Hermes dışa aktarımları tamamlandı.
- `git diff --check`: boşluk hatası yok. Windows satır sonu bilgilendirmeleri var.

## Gerçek EGO bağlantısı

- `/v1/lines`: 659 hat, 481 ve 481-6 varyantları.
- `/v1/lines/481/schedule`: 102 durak, 36 hafta içi kalkış; hafta sonu sekmeleri tarayıcıda değiştirildi.
- `/v1/lines/481-6/schedule`: üç gün türünde 4 gece seferi; özel başlangıç notları korundu.
- `/v1/stops/10940/arrivals`: ilk denemelerde bağlantı başarısız; sonrasında 6 kayıt ve 1 güncel araç tahmini başarıyla geldi. Tarayıcıda planlı kayıtlar ile 28 dk tahmini ayrı görüldü. Gösterilen değer yalnızca test anına aittir.
- EGO Mac'in eski hat AJAX adresi 404 verdi; güncel resmî hareket saati sayfasının otobüs seçimi kullanıldı.

## Tarayıcı doğrulaması

- 390 × 844 telefon görünümünde Keşfet → Ayrancı araması → yeni Çankaya Belediyesi kaydı → Nasıl giderim ekranı, doğru ad/adres ve dış navigasyon düğmeleri.
- Yeni kayıt ücretsiz olarak etiketlenmiyor; bilinmeyen saat/ücret/başvuru açıkça gösteriliyor.
- Hizmet detayı → EGO ekranı; 481 araması → gerçek tarife → Cumartesi seçimi.
- Yerel listede olmayan 10940 kodunu doğrudan sorgulama → EGO araç yanıtı.
- Veri alındıktan sonra görülen React `key` spread uyarısı düzeltildi ve yeniden yüklemede kaybolduğu doğrulandı.
- Telefon ekran görüntüleri: `transport-mobile.png`, `ego-mobile.png`.
- Önceki sürümde onboarding, iki duraklı plan, kaydetme/kalıcılık, tema, yüksek kontrast ve geniş ekran kontrolleri de yapılmıştı.

## Sınırlar

Fiziksel Android/iOS cihazı, gerçek konum izni, TalkBack/VoiceOver ve imzalı kurulum paketi bu ortamda test edilmedi. Dış Google Haritalar yolculuğunun sahada doğrulaması yapılmadı. EGO resmî entegrasyon sözleşmesi veya kesintisizlik garantisi yoktur. Native JS paketinin oluşması telefonda çalıştırma kanıtı değildir. Dağıtım adımları `MOBILE.md` içinde.
