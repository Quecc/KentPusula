import {
  Category,
  CityService,
  Coordinates,
  Intent,
  Match,
  Profile,
} from "../types";
import { openingStatus } from "../utils/time";

export const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const rad = (n: number) => (n * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function parseIntent(text: string): Intent {
  const t = normalize(text);
  const words: Record<Category, RegExp> = {
    food: /yemek|acim|karni|sofra/,
    study: /ders|calis|kutuphane|sessiz|kitap/,
    wifi: /wi.?fi|internet/,
    sport: /spor|yuzme|fitness/,
    course: /kurs|egitim|ogrenmek|ogreniyorum|ogrenebil/,
    career: /kariyer|\bcv\b|is ar|ozgecmis/,
    culture: /kultur|sanat|sergi|muze/,
    support: /destek|danisman|yardim/,
  };
  const age = t.match(/(?:^|\s)(\d{1,3})\s*yas/);
  const duration = t.match(/(\d+)\s*(saat|dakika)/);
  const requested = (Object.keys(words) as Category[]).filter((c) =>
    words[c].test(t),
  );
  if (!requested.length && duration && /bos|vakt|zaman/.test(t))
    requested.push("study");
  return {
    text,
    categories: requested,
    age: age && +age[1] <= 120 ? +age[1] : undefined,
    student: /ogrenci degil/.test(t)
      ? false
      : /ogrenci/.test(t)
        ? true
        : undefined,
    durationMinutes: duration
      ? Math.min(
          480,
          Math.max(15, +duration[1] * (duration[2] === "saat" ? 60 : 1)),
        )
      : 180,
    dayOffset: /yarin/.test(t) ? 1 : 0,
  };
}
export function matchService(
  service: CityService,
  profile: Profile,
  date: Date,
): Match {
  const reasons: string[] = [],
    cautions: string[] = [];
  let eligible = true,
    score = 0;
  if (service.studentRequired) {
    if (profile.student === false) {
      eligible = false;
      cautions.push("Üniversite öğrencisi olma koşulu var.");
    } else if (profile.student === true) {
      reasons.push(
        "Öğrenci olduğunu belirttin. Üniversite öğrenci kimliği gerekli.",
      );
      score += 15;
    } else cautions.push("Üniversite öğrencisi olduğunu teyit etmelisin.");
  }
  if (service.ageMin !== null || service.ageMax !== null) {
    if (profile.age === undefined)
      cautions.push("Yaş koşulu için yaşını belirt.");
    else if (
      (service.ageMin !== null && profile.age < service.ageMin) ||
      (service.ageMax !== null && profile.age > service.ageMax)
    ) {
      eligible = false;
      cautions.push("Yaş koşulunu karşılamıyorsun.");
    } else {
      reasons.push("Yaş koşulunu karşılıyorsun.");
      score += 10;
    }
  }
  const distance =
    profile.location && service.latitude !== null && service.longitude !== null
      ? distanceKm(profile.location, {
          latitude: service.latitude,
          longitude: service.longitude,
        })
      : null;
  if (distance !== null) {
    reasons.push(`Yaklaşık ${distance.toFixed(1)} km kuş uçuşu mesafede.`);
    score += Math.max(0, 15 - distance);
  }
  const status = openingStatus(service, date);
  if (status.open === true) {
    reasons.push("Yayımlanan programa göre bu saatte açık.");
    score += 10;
  } else cautions.push(status.label);
  if (service.isFree) {
    reasons.push("Resmî kaynakta ücretsiz olarak belirtiliyor.");
    score += 10;
  } else cautions.push("Ücret bilgisi teyit edilmeli.");
  if (service.applicationRequired === false)
    reasons.push("Başvuru gerekmiyor.");
  else
    cautions.push(
      service.applicationRequired
        ? "Kayıt / başvuru gerekiyor."
        : "Başvuru koşulu teyit edilmeli.",
    );
  if (service.sourceStatus === "historical")
    cautions.push("Güncel hizmet durumu teyit edilmeli.");
  return { service, score, eligible, reasons, cautions, distance };
}
export function findMatches(
  services: CityService[],
  profile: Profile,
  date: Date,
  categories: Category[] = [],
  query = "",
  radius = Infinity,
): Match[] {
  const needle = normalize(query);
  return services
    .filter(
      (s) =>
        (!categories.length || categories.includes(s.category)) &&
        (!needle ||
          normalize(
            `${s.name} ${s.description} ${s.tags.join(" ")} ${s.district}`,
          ).includes(needle)),
    )
    .map((s) => matchService(s, profile, date))
    .filter((m) => m.eligible && (m.distance === null || m.distance <= radius))
    .sort((a, b) => b.score - a.score);
}
