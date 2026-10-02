import Constants from "expo-constants";
import { Platform } from "react-native";
import stopData from "../data/transport/stops.json";
import { CityService, Coordinates } from "../types";
import {
  Arrival,
  EgoLine,
  EgoStop,
  Schedule,
  TransportResponse,
} from "../types/transport";
import { normalize } from "./matching";
import { directEgoProvider } from "./egoDirect";

export const stopSnapshotDate = stopData.updated;
const stops: EgoStop[] = stopData.stops.map((s) => ({
  code: s.r,
  name: s.n || "Adı belirtilmemiş durak",
}));
export function searchStops(query: string): EgoStop[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return stops
    .filter((s) => s.code.includes(q) || normalize(s.name).includes(q))
    .slice(0, 5);
}
export function directionsUrl(
  service: Pick<
    CityService,
    "name" | "address" | "latitude" | "longitude" | "coordinatesApproximate"
  >,
  origin?: Coordinates,
  mode: "transit" | "walking" = "transit",
) {
  // An approximate pin must not override a published postal address.
  const destination =
    service.latitude !== null &&
    service.longitude !== null &&
    !service.coordinatesApproximate
      ? `${service.latitude},${service.longitude}`
      : `${service.name} ${service.address} Ankara`;
  return (
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${mode}` +
    (origin ? `&origin=${origin.latitude},${origin.longitude}` : "")
  );
}
function apiBase() {
  const configured = process.env.EXPO_PUBLIC_TRANSPORT_API_URL?.replace(
    /\/$/,
    "",
  );
  if (configured) {
    const url = new URL(configured);
    if (
      url.protocol !== "https:" &&
      !(typeof __DEV__ !== "undefined" && __DEV__ && url.protocol === "http:")
    )
      throw new Error("Ulaşım servisi için güvenli HTTPS adresi gerekli.");
    return configured;
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const host =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.hostname
        : Constants.expoConfig?.hostUri?.split(":")[0];
    if (host) return `http://${host}:8787`;
  }
  throw new Error(
    "Ulaşım bağlantısı henüz yapılandırılmadı. Resmî EGO sayfasını veya yol tarifini kullanabilirsin.",
  );
}
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}
const text = (v: unknown): v is string => typeof v === "string";
const validLine = (v: unknown): v is EgoLine =>
  object(v) && text(v.code) && text(v.name);
const validArrival = (v: unknown): v is Arrival =>
  object(v) &&
  text(v.line) &&
  text(v.destination) &&
  text(v.description) &&
  ["live", "scheduled", "unknown"].includes(String(v.kind)) &&
  (v.minutes === null || (typeof v.minutes === "number" && v.minutes >= 0)) &&
  (v.vehicleUpdatedAt === null || text(v.vehicleUpdatedAt));
const validSchedule = (v: unknown): v is Schedule =>
  object(v) &&
  text(v.line) &&
  text(v.name) &&
  text(v.origin) &&
  text(v.destination) &&
  Array.isArray(v.days) &&
  v.days.every(
    (d) =>
      object(d) &&
      text(d.label) &&
      Array.isArray(d.departures) &&
      d.departures.every((x) => object(x) && text(x.time) && text(x.note)),
  ) &&
  Array.isArray(v.stops) &&
  v.stops.every(
    (s) =>
      object(s) &&
      typeof s.order === "number" &&
      text(s.code) &&
      text(s.name) &&
      text(s.address),
  );
async function request<T>(
  path: string,
  valid: (v: unknown) => v is T,
  signal?: AbortSignal,
): Promise<TransportResponse<T>> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", cancel);
  const timeout = setTimeout(cancel, 16000);
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok)
      throw new Error(
        object(body) && text(body.error)
          ? body.error
          : "EGO bağlantısı kurulamadı.",
      );
    if (
      !object(body) ||
      !valid(body.data) ||
      !text(body.fetchedAt) ||
      !Number.isFinite(Date.parse(body.fetchedAt)) ||
      !text(body.source)
    )
      throw new Error("EGO verisinin biçimi doğrulanamadı.");
    return { data: body.data, fetchedAt: body.fetchedAt, source: body.source };
  } catch (error) {
    if (error instanceof Error && !/fetch|network|abort/i.test(error.message))
      throw error;
    throw new Error(
      "Ulaşım servisine bağlanılamadı. İnternet bağlantını kontrol et; resmî EGO sayfasından da devam edebilirsin.",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
const proxyEgoProvider = {
  lines: (signal?: AbortSignal) =>
    request(
      "/v1/lines",
      (v): v is EgoLine[] => Array.isArray(v) && v.every(validLine),
      signal,
    ),
  schedule: (line: string, signal?: AbortSignal) =>
    request(
      `/v1/lines/${encodeURIComponent(line)}/schedule`,
      validSchedule,
      signal,
    ),
  arrivals: (stop: string, signal?: AbortSignal) =>
    request(
      `/v1/stops/${encodeURIComponent(stop)}/arrivals`,
      (v): v is Arrival[] => Array.isArray(v) && v.every(validArrival),
      signal,
    ),
};

export const egoProvider =
  Platform.OS !== "web" && !process.env.EXPO_PUBLIC_TRANSPORT_API_URL
    ? directEgoProvider
    : proxyEgoProvider;
