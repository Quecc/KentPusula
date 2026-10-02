# Kaynak defteri — 1 Ekim 2026

Bu katalog bir canlı belediye veri akışı değildir. Kaynakların okunması güncel kapasite, açık olma, adres doğruluğu veya başvuru uygunluğu garantisi vermez. `verifiedAt` alanı bu nedenle boştur.

| Kayıt grubu | Resmî kaynak | Kullanılan bilgi / sınır |
| --- | --- | --- |
| 4 Gençlik Sofrası | https://gencliksofralari.ankara.bel.tr/ | Adlar, adresler, üniversite öğrencilerine ücretsiz yemek ve hafta içi takvim. Program sayfası 17–20; başka ABB sayfası 18–20 diyor. Çelişki detayda açıkça yazılır. |
| Saat/kayıt çapraz kontrol | https://direct.ankara.bel.tr/hizmetler/sosyal-hizmetler/genclik-sofralari | Kimlik, öğrenci teyidi ve kayıt koşulları. |
| 7 kütüphane/çalışma alanı + ODTÜ internet hizmeti | https://www.ankara.bel.tr/haberler/abb-nin-kutuphane-ve-calisma-istasyonlari-baskentli-ogrencileri-bekliyor-16182 | Kamu çalışma alanları ve ODTÜ ücretsiz internet. Eski duyuru; saatler bilinmiyor. |
| 100. Yıl Gençlik Kütüphanesi | https://www.ankara.bel.tr/tr/haberler/abb-den-universite-gencligine-tam-destek-17794 | Kütüphane hizmeti ve ücretsiz kullanım; güncel saatler bilinmiyor. |
| 35 BELMEK branşı | https://www.ankara.bel.tr/haberler/belmek-te-yeni-donem-kurs-kayitlari-basladi-17280 | 2024–2025 duyurusundaki branşlar. Duyurunun geçmiş başvuru tarihleri güncel tarihe taşınmaz. Branşlar fiziksel mekân değildir, haritaya pin eklenmez. |
| Kariyer Merkezi | https://www.ankara.bel.tr/haberler/is-arayan-vatandaslarla-isveren-firmalar-arasindaki-kopru-abb-kariyer-merkezi-17931 | Merkez ve danışmanlık; güncel randevu/takvim bilinmiyor. |
| Kadın Danışma Merkezi | https://www.ankara.bel.tr/hizmetler/kadin-ve-aile-hizmetleri/kadin-danisma-merkezi | Destek hizmeti; kesin koşullar kurumdan teyit edilmeli. |

Önceki 14 hizmet koordinatı yaklaşık kent içi gösterim içindir. Eklenen 36 hizmet koordinatı resmî belediye rehberlerinden alınmıştır; saha doğrulaması değildir. Mesafeler kuş uçuşudur. Yaklaşık eski noktalarla navigasyon adres aramasına; yeni belediye konumlarıyla navigasyon yayımlanmış koordinata açılır. OpenStreetMap standart raster tile hizmeti yalnızca görüntülenen alana istek yapar; toplu indirme yoktur. Atıf haritada görünür.

Expo başlangıcı ve TypeScript kurulumu: https://docs.expo.dev/more/create-expo/ ve https://docs.expo.dev/guides/typescript/

## 50 harita hizmet noktasına genişletme

27 Çankaya Evi: https://www.cankaya.bel.tr/cankaya-evleri ve her merkezin bağlantılı `kentrehberi.cankaya.bel.tr/OnemliNoktaGosterByGuid` sayfasındaki GeoJSON. Merkez adı, adres, telefon ve koordinat alındı. Güncel ücretsiz kurs/etkinlik kapsamı teyit edilmediği için `isFree: null`.

9 ABB merkezi: Altındağ Gençlik, Akyurt AYM, Çubuk AYM, Esertepe AYM, Mamak Gençlik, Yenimahalle Gençlik, Keçiören Kadın Danışma, Şafaktepe Kadın Danışma ve Şentepe Kadın Danışma. `www.ankara.bel.tr/tesis/` detaylarının adres ve harita alanları kullanıldı. Her kaydın tam kaynağı `data/places.json` içindedir.

Kaynak kontrolünde bazı diğer merkezlerin koordinatlarının adresleriyle çeliştiği (aynı noktanın tekrarı, ters enlem/boylam, yanlış ilçe) görüldü; bu adaylar eklenmedi. Yeni 36 noktanın koordinatları birbirinden farklıdır. Katalog 86 kayıttır: 50 haritada gösterilen hizmet, 35 konumsuz branş ve 1 konumsuz genel program. Mevcut katalogdaki aynı tesise bağlı farklı hizmetler ayrı kayıt olmaya devam eder.

Ulaşım kaynakları ve veri tazeliği: [TRANSPORT.md](TRANSPORT.md). Durak verisi ODbL lisanslıdır; kaynak ve tam yazılım lisansı [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) içinde.
