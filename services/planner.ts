import { CityPlan, CityService, Coordinates, Intent, Profile } from "../types";
import { ankaraTime, toMinutes } from "../utils/time";
import { distanceKm, findMatches, normalize } from "./matching";

export function createPlan(
  services: CityService[],
  intent: Intent,
  profile: Profile,
  now: Date,
  demo = false,
): CityPlan {
  const date = new Date(now.getTime() + intent.dayOffset * 86400000);
  const local = ankaraTime(date);
  const effective = {
    ...profile,
    age: intent.age ?? profile.age,
    student: intent.student ?? profile.student,
  };
  const plan: CityPlan = {
    stops: [],
    warnings: [],
    intent,
    date: local.date,
    demo,
  };
  if (!intent.categories.length) {
    plan.warnings.push(
      "İhtiyacını biraz aç: yemek, ders çalışma, kurs veya kariyer desteği yazabilirsin.",
    );
    return plan;
  }
  let current = local.minutes,
    origin: Coordinates | undefined = profile.location;
  const end = Math.min(1440, current + intent.durationMinutes);
  const ordered = [...intent.categories].sort((a, b) =>
    a === "food" ? -1 : b === "food" ? 1 : 0,
  );
  for (const category of ordered) {
    const matches = findMatches(
      services,
      { ...effective, location: origin },
      date,
      [category],
    );
    let placed = false;
    for (const match of matches) {
      const s = match.service;
      if (normalize(intent.text).includes("ucretsiz") && s.isFree !== true)
        continue;
      if (s.sourceStatus === "historical" && !demo) continue;
      const dest =
        s.latitude !== null && s.longitude !== null
          ? { latitude: s.latitude, longitude: s.longitude }
          : undefined;
      // An unlocated programme is a discovery result, never a physical itinerary stop.
      if (!dest) continue;
      const travel = origin
        ? Math.max(2, Math.ceil(((distanceKm(origin, dest) * 1.3) / 4.5) * 60))
        : 10;
      const duration =
        category === "study" ? 60 : category === "food" ? 35 : 45;
      let start = current + travel;
      if (s.openingHours) {
        const slots = s.openingHours.filter((h) => h.days.includes(local.day));
        const slot = slots.find(
          (h) =>
            Math.max(start, toMinutes(h.open)) + duration <= toMinutes(h.close),
        );
        if (!slot) continue;
        start = Math.max(start, toMinutes(slot.open));
      } else if (!demo) continue;
      if (start + duration > end) continue;
      plan.stops.push({
        match,
        startMinute: start,
        durationMinutes: duration,
        travelMinutes: travel,
        provisional: demo || !s.openingHours,
      });
      current = start + duration;
      origin = dest;
      placed = true;
      break;
    }
    if (!placed)
      plan.warnings.push(
        `${category === "food" ? "Yemek" : category === "study" ? "Çalışma" : "Bu ihtiyaç"} için bu zaman aralığında teyitli bir durak planlanamadı. Keşfet’te kaynakları inceleyebilirsin.`,
      );
  }
  if (demo)
    plan.warnings.push(
      "Sunum planı: 1 Ekim 2026, 17.00 başlangıcı. Çalışma saatleri ve ulaşım süreleri örnektir; gitmeden kurumu kontrol et.",
    );
  else if (plan.stops.length)
    plan.warnings.push(
      "Saatler yayımlanan programa dayanır; tatil, kapasite ve kayıt durumu kurumdan teyit edilmelidir. Ulaşım süresi tahmindir.",
    );
  return plan;
}
