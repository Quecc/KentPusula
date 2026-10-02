# Ulaşım kaynakları ve lisanslar

- Mobil harita: [Leaflet 1.9.4](https://leafletjs.com), BSD 2-Clause; Volodymyr Agafonkin ve CloudMade. Tam lisans, dağıtılan `data/map/leaflet-runtime.json` içindeki `license` alanındadır. Harita katmanları © OpenStreetMap contributors; uygulama üzerinde atıf gösterilir.
- `data/transport/access.json` içindeki yakın durak konumları: © OpenStreetMap contributors, ODbL. 02.10.2026 sorgusu; kayıtların `locationSourceUrl` alanlarında durak kaynağı, `coordinateSourceUrl` alanlarında hedef kaynağı, hatların `sourceUrl` alanlarında resmî EGO tarife kaynağı bulunur.

- [EGO Mac — byigitt/egomac](https://github.com/byigitt/egomac), incelenen revizyon: `5760f802a30b05ad0a7fe59e7635885e52bbc8ea`. EGO uç nokta sözleşmeleri ve gömülü durak verisi bu projeden yararlanılarak uyarlandı. Yazılım: MIT, Copyright (c) 2026 Barış Cem Bayburtlu (@byigitt). [Tam lisans](licenses/egomac-MIT.txt).
- [EgoPy — alpkeskin/EgoPy](https://github.com/alpkeskin/EgoPy): teknik referans olarak incelendi; kod kopyalanmadı. Eski düz HTTP uç noktaları kullanılmadı.
- `data/transport/stops.json`: **© OpenStreetMap contributors**, [Open Database License / ODbL](https://opendatacommons.org/licenses/odbl/1-0/), [atıf ve telif bilgisi](https://www.openstreetmap.org/copyright). EGO Mac'in 02.05.2026 tarihli 2.943 ad/numara kaydı açılmış JSON biçiminde, veri içeriği değiştirilmeden dağıtılır. Bu dosya ODbL kapsamındadır; yazılımın MIT lisansı durak verisinin yerine geçmez.
- [EGO hareket saatleri](https://www.ego.gov.tr/hareketsaatleri): tarifeler ve güzergâh bilgisi, alınma tarihiyle gösterilir. EGO adının kullanımı yalnızca veri kaynağını belirtir. KentPusula resmî EGO uygulaması değildir.
- Belediyelerin kamu rehberleri: ABB ve Çankaya Belediyesi; yeni kayıtların `officialSourceUrl` ve `coordinateSourceUrl` alanları dosyada bulunur. Logo/fotoğrafları alınmadı; yer adları, adresler, kamuya açık telefonlar ve harita koordinatları kullanıldı.
