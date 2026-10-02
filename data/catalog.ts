import { Category, CityService } from "../types";
import places from "./places.json";
import { applyPublishedDestinationPoint } from "../services/destinationPoint";

export const categories: {
  id: Category;
  name: string;
  icon: string;
  number: string;
}[] = [
  { id: "food", name: "Yemek", icon: "restaurant-outline", number: "01" },
  { id: "study", name: "Çalışma", icon: "book-outline", number: "02" },
  { id: "wifi", name: "Wi-Fi", icon: "wifi-outline", number: "03" },
  { id: "sport", name: "Spor", icon: "bicycle-outline", number: "04" },
  { id: "course", name: "Kurslar", icon: "school-outline", number: "05" },
  { id: "career", name: "Kariyer", icon: "briefcase-outline", number: "06" },
  {
    id: "culture",
    name: "Kültür",
    icon: "color-palette-outline",
    number: "07",
  },
  { id: "support", name: "Destek", icon: "heart-outline", number: "08" },
];
export const DEMO_QUERY =
  "20 yaşındayım, öğrenciyim. Bugün ücretsiz yemek yiyebileceğim ve ders çalışabileceğim bir yer arıyorum.";
export const DEFAULT_LOCATION = { latitude: 39.9208, longitude: 32.8541 };
export const DEMO_DATE = "2026-10-01T17:00:00+03:00";
const checked = "2026-10-01";
const foodSource = "https://gencliksofralari.ankara.bel.tr/";
const librarySource =
  "https://www.ankara.bel.tr/haberler/abb-nin-kutuphane-ve-calisma-istasyonlari-baskentli-ogrencileri-bekliyor-16182";
const courseSource =
  "https://www.ankara.bel.tr/haberler/belmek-te-yeni-donem-kurs-kayitlari-basladi-17280";
function record(
  input: Partial<CityService> &
    Pick<CityService, "id" | "name" | "category" | "officialSourceUrl">,
): CityService {
  return {
    description: "",
    provider: "Ankara Büyükşehir Belediyesi",
    latitude: null,
    longitude: null,
    district: "Ankara geneli",
    address: "Merkez seçimi resmî başvuru kanalından yapılır.",
    eligibility: "Güncel katılım koşullarını kurumdan teyit et.",
    ageMin: null,
    ageMax: null,
    studentRequired: false,
    documents: ["Güncel belge listesi kurumdan teyit edilmeli."],
    openingHours: null,
    applicationRequired: null,
    applicationUrl: null,
    phone: null,
    verifiedAt: null,
    sourceCheckedAt: checked,
    lastUpdatedAt: checked,
    tags: [],
    isFree: true,
    sourceStatus: "historical",
    sourceNote:
      "Resmî duyuruda yer alıyor. Güncel takvim ve kontenjan teyit edilmedi.",
    coordinatesApproximate: true,
    ...input,
  };
}
const meals: [string, string, string, string, number, number][] = [
  [
    "kizilay",
    "100. Yıl Gençlik Sofrası",
    "Çankaya",
    "İzmir 2 Caddesi, Kızılay / Ankara",
    39.9199,
    32.8503,
  ],
  [
    "sihhiye",
    "Sıhhiye Gençlik Sofrası",
    "Çankaya",
    "Sıhhiye Çok Katlı Otopark, 1. kat",
    39.9285,
    32.8559,
  ],
  [
    "anittepe",
    "Anıttepe Gençlik Sofrası",
    "Çankaya",
    "Anıttepe Mahallesi, Kubilay Sokak No:2",
    39.9238,
    32.8394,
  ],
  [
    "gazi",
    "Gazi Mahallesi Gençlik Sofrası",
    "Yenimahalle",
    "Emniyet Mahallesi, Silahtar Caddesi No:36",
    39.941,
    32.822,
  ],
];
const libraries: [string, string, string, number, number][] = [
  ["yuzuncuyil", "100. Yıl Gençlik Kütüphanesi", "Çankaya", 39.9199, 32.8503],
  ["kizilay-metro", "Kızılay Çalışma İstasyonu", "Çankaya", 39.9205, 32.8543],
  ["dikimevi", "Dikimevi Çalışma İstasyonu", "Çankaya", 39.9323, 32.8842],
  ["odtu", "ODTÜ Çalışma İstasyonu", "Çankaya", 39.9098, 32.7854],
  ["asti", "AŞTİ Kütüphanesi", "Yenimahalle", 39.9185, 32.8134],
  [
    "kuscagiz",
    "Kuşcağız Aile Yaşam Merkezi Kütüphanesi",
    "Keçiören",
    40.002,
    32.849,
  ],
  [
    "elvankent",
    "Elvankent Aile Yaşam Merkezi Kütüphanesi",
    "Etimesgut",
    39.9605,
    32.6416,
  ],
  [
    "osmanli",
    "Osmanlı Aile Yaşam Merkezi Kütüphanesi",
    "Sincan",
    39.965,
    32.574,
  ],
];
const branches = [
  "Makine Nakışı",
  "El Nakışı",
  "Sim Sırma",
  "İğne Oyası",
  "Şiş Dantel",
  "Tel Kırma",
  "Dantel Anglez",
  "Giyim",
  "Filografi",
  "Kat-ı",
  "Mefruşat",
  "Patchwork",
  "Trikotaj",
  "Yorganlama",
  "Ahşap Boyama",
  "Kumaş Boyama",
  "İpek Pentur",
  "Tezhip-Hat",
  "Minyatür",
  "Ebru",
  "Çini",
  "Seramik",
  "Mozaik",
  "Rölyef",
  "Ahşap Rölyef",
  "Taş Bebek",
  "Takı Tasarımı",
  "Gümüş İşlemeciliği",
  "Turistik El Sanatları",
  "Ev Ekonomisi-Yemek",
  "Resim",
  "Kilim",
  "El Örgücülüğü",
  "Sepet Örücülüğü",
  "Jüt Kari",
];
const catalogServices: CityService[] = [
  ...meals.map(([id, name, district, address, latitude, longitude]) =>
    record({
      id: `food-${id}`,
      name,
      category: "food",
      district,
      address,
      latitude,
      longitude,
      description: "Üniversite öğrencileri için ücretsiz sıcak akşam yemeği.",
      eligibility:
        "Üniversite öğrencileri; karekod ile öğrenci kaydı gerekebilir.",
      studentRequired: true,
      documents: ["T.C. kimlik kartı", "Öğrenci kimliği"],
      applicationRequired: true,
      applicationUrl: foodSource,
      openingHours: [{ days: [1, 2, 3, 4, 5], open: "17:00", close: "20:00" }],
      officialSourceUrl: foodSource,
      sourceStatus: "source-backed",
      tags: ["Sıcak yemek", "Öğrenci"],
      sourceNote:
        "Program sayfası 17.00–20.00, diğer ABB sayfası 18.00–20.00 diyor. Saat ve kayıt koşullarını gitmeden teyit et. Konum yaklaşık.",
    }),
  ),
  ...libraries.map(([id, name, district, latitude, longitude]) =>
    record({
      id: `study-${id}`,
      name,
      category: "study",
      district,
      latitude,
      longitude,
      address: `${name}, ${district} / Ankara — kesin giriş adresi kurumdan teyit edilmeli.`,
      description: "Okumak ve ders çalışmak için kamusal bir alan.",
      eligibility: "Üyelik ve giriş koşullarını kurumdan teyit et.",
      officialSourceUrl:
        id === "yuzuncuyil"
          ? "https://www.ankara.bel.tr/tr/haberler/abb-den-universite-gencligine-tam-destek-17794"
          : librarySource,
      tags:
        id === "odtu"
          ? ["Çalışma", "Wi-Fi", "Bilgisayar"]
          : ["Çalışma", "Kütüphane"],
    }),
  ),
  ...branches.map((name, index) =>
    record({
      id: `belmek-${index + 1}`,
      name: `BELMEK · ${name}`,
      category: "course",
      description:
        "Belediyenin el becerisi kurs programında yer alan bir eğitim branşı.",
      officialSourceUrl: courseSource,
      applicationRequired: true,
      applicationUrl: "https://belmek.ankara.bel.tr/",
      tags: ["El becerisi", "Kültür", "Kurs"],
      sourceNote:
        "2024–2025 duyurusundaki branş. 2026 kaydı, merkez ve kontenjanı doğrulanmadı. Güncel başvuru sayfasını kontrol et.",
    }),
  ),
  record({
    id: "career-abb",
    name: "ABB Kariyer Merkezi",
    category: "career",
    district: "Altındağ",
    description:
      "İş arama sürecinde danışmanlık ve işverenlerle buluşma desteği.",
    address: "Doğanbey Mahallesi, Hisarparkı Caddesi No:14/12, Gençlik Parkı",
    latitude: 39.9395,
    longitude: 32.8515,
    officialSourceUrl:
      "https://www.ankara.bel.tr/haberler/is-arayan-vatandaslarla-isveren-firmalar-arasindaki-kopru-abb-kariyer-merkezi-17931",
    tags: ["CV", "İş", "Danışmanlık"],
  }),
  record({
    id: "support-women",
    name: "Kadın Danışma Merkezi",
    category: "support",
    description: "Kadınlar için danışmanlık ve destek hizmetleri.",
    eligibility:
      "Kadınlara yönelik; hizmete özel koşullar kurum tarafından değerlendirilir.",
    officialSourceUrl:
      "https://www.ankara.bel.tr/hizmetler/kadin-ve-aile-hizmetleri/kadin-danisma-merkezi",
    tags: ["Danışmanlık", "Kadın"],
  }),
  record({
    id: "wifi-odtu",
    name: "ODTÜ Çalışma İstasyonu · İnternet",
    category: "wifi",
    district: "Çankaya",
    description:
      "Çalışma istasyonunda ücretsiz internet ve bilgisayar erişimi.",
    latitude: 39.9098,
    longitude: 32.7854,
    address: "ODTÜ Metro İstasyonu, Çankaya / Ankara",
    officialSourceUrl: librarySource,
    tags: ["Wi-Fi", "Bilgisayar"],
  }),
  ...places.map((place) =>
    record(
      place as Partial<CityService> &
        Pick<CityService, "id" | "name" | "category" | "officialSourceUrl">,
    ),
  ),
];

export const services: CityService[] = catalogServices.map(
  applyPublishedDestinationPoint,
);
