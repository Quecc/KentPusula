# Android ve iPhone hazırlığı

Uygulama Expo SDK 57 / React Native ile hazırlanmıştır; telefon ekranları aynı kaynak kodundan üretilir. Expo Router ile `kentpusula://transport/<hizmet-kimliği>` ve hizmet bağlantıları desteklenir. Güvenli alanlar, 48 px dokunma kontrolleri, dikey kaydırma, cihaz konum izni, haptik geri bildirim ve AsyncStorage hazırdır. Konum yalnızca oturum belleğinde kalır. Arka plan konum izni istenmez.

`app.json`: `com.kentpusula.app` Android paketi ve iOS bundle kimliği, ikonlar, uygulama şeması ve Türkçe konum açıklaması bulunur. Mağaza hesabında bu kimliklerin uygunluğu henüz doğrulanmadı.

`eas.json` profilleri:

- `preview`: Android APK; iOS için kayıtlı cihazlara iç dağıtım.
- `ios-simulator`: macOS iOS simülatörü için imzasız simülatör hedefi.
- `production`: mağaza derlemesi; otomatik sürüm numarası artışı.

## İlk kurulum paketi

1. EAS hesabına giriş yap ve projeyi kendi hesabına bağla (`npx eas-cli@latest login --browser`, `npx eas-cli@latest init`).
2. Android/iOS resmî EGO HTTPS uç noktalarını doğrudan kullanır; geliştiricinin bilgisayarına bağlı değildir. İsteğe bağlı ortak proxy için EAS ortamında `EXPO_PUBLIC_TRANSPORT_API_URL` tanımlanabilir. Web için HTTPS proxy gerekir. `EXPO_PUBLIC_` değişkenleri uygulamada görünür; gizli anahtar koyma.
3. Android deneme: `npx eas-cli@latest build --profile preview --platform android`.
4. iOS: `npx eas-cli@latest build --profile preview --platform ios`. Fiziksel iPhone dağıtımı Apple hesabı/imzası ve cihaz kaydı gerektirir. Simülatör için `ios-simulator` profilini seç.
5. Cihazda konum izni/ret, internet kesintisi, EGO hatası, büyük metin, TalkBack/VoiceOver, geri düğmesi ve soğuk açılış bağlantılarını doğrula.

Android haritası WebView içinde Leaflet ile çalışır. Harita kodu ve stilleri uygulamada paketlenir; Google Maps anahtarı veya dış JavaScript CDN'si gerekmez. OpenStreetMap HTTPS harita görselleri için internet gerekir. Yükleme hatasında yeniden deneme sunulur. `npm run bundle:map` ve EAS kurulum kancası Leaflet lisansıyla birlikte yerel dosyayı üretir.

Harita seçimleri WebView'i yeniden kurmaz; köprü üzerinden güncellenir ve yakınlaştırma korunur. Durak ekranı yalnız uygulama önplandayken 30 saniye aralıklarla sorgular; dönüşte yeni sorgu yapılır. 60 saniye eski yanıt canlı tahmin olarak sunulmaz. Kaydedilen hizmetler/görünüm tercihleri korunarak eski sürümlerin otomatik sunum saati bir kez kapatılır.

Web ve Android/iOS JS dışa aktarımı cihaz çalıştırma testi değildir. Fiziksel telefon, iOS imzası ve mağaza gönderimi ayrıca doğrulanmalıdır. APK bağlantısı başarılı EAS derlemesinin çıktısından alınır.

Resmî belgeler: [EAS yapılandırması](https://docs.expo.dev/eas/json/), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
