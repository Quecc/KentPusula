import { Departure } from "../types/transport";
import { ankaraTime, toMinutes } from "../utils/time";

export function scheduleDay(date: Date) {
  const { day } = ankaraTime(date);
  return day === 6 ? 1 : day === 0 ? 2 : 0;
}

export function remainingDepartures(departures: Departure[], date: Date) {
  const { minutes } = ankaraTime(date);
  return departures.filter((departure) => toMinutes(departure.time) >= minutes);
}

export function arrivalResponseFresh(fetchedAt: string, now: number) {
  const age = now - Date.parse(fetchedAt);
  return Number.isFinite(age) && age >= -30000 && age < 60000;
}
