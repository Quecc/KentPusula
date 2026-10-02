import { CityService } from "../types";
export function ankaraTime(date: Date) {
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return {
    day: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    date: shifted.toISOString().slice(0, 10),
  };
}
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const clock = (minute: number) =>
  `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export function openingStatus(
  service: CityService,
  date: Date,
): { label: string; open: boolean | null } {
  if (!service.openingHours)
    return { label: "Saat teyidi gerekli", open: null };
  const { day, minutes } = ankaraTime(date);
  const today = service.openingHours.filter((h) => h.days.includes(day));
  if (!today.length) return { label: "Bugün kapalı", open: false };
  if (
    today.some(
      (h) => minutes >= toMinutes(h.open) && minutes < toMinutes(h.close),
    )
  )
    return { label: "Programa göre açık", open: true };
  const next = today.find((h) => toMinutes(h.open) > minutes);
  return {
    label: next ? `${next.open}’de açılıyor` : "Şu an kapalı",
    open: false,
  };
}
