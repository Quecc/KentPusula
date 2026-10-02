import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { services } from "../data/catalog";
import { parseSchedule } from "../server/ego";
import type { CityService } from "../types";
import type { DestinationAccess } from "../services/destinationAccess";
import { getPublishedDestinationPoint } from "../services/destinationPoint";
import {
  atomicWriteJson,
  EvidenceCache,
  oldestEvidenceDate,
} from "./transportEvidence";

export type OsmStop = {
  id: number;
  lat: number;
  lon: number;
  tags: { ref?: string; name?: string };
};
export type OsmSnapshot = {
  osm3s: { timestamp_osm_base: string };
  elements: OsmStop[];
};
export type Manifest = {
  updated: string;
  destinations: DestinationAccess[];
  coordinatesAttribution?: string;
  coordinatesSnapshotAt?: string;
  distanceMethod?: string;
  rebuiltAt?: string;
};
const geoDistance = (
  a: { latitude: number; longitude: number },
  b: OsmStop,
) => {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lon - a.longitude) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
};
async function upstream(url: string, body?: string) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "KentPusula transit research",
      Referer: "https://www.ego.gov.tr/HareketSaatleri",
    },
    signal: AbortSignal.timeout(16000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function rebuildDestinationAccess(options: {
  manifest: Manifest;
  services: CityService[];
  osm: OsmSnapshot;
  cache: EvidenceCache;
  fetchText?: typeof upstream;
  now?: () => Date;
  log?: (message: string) => void;
}) {
  const manifest = structuredClone(options.manifest);
  const load = options.fetchText ?? upstream;
  const log = options.log ?? (() => {});
  const stops = options.osm.elements.filter(
    (stop) =>
      /^\d{5}$/.test(stop.tags?.ref || "") &&
      Number.isFinite(stop.lat) &&
      Number.isFinite(stop.lon),
  );
  const scheduleCache = new Map<
    string,
    { data: ReturnType<typeof parseSchedule>; fetchedAt: string }
  >();
  const stopCache = new Map<
    string,
    {
      lines: DestinationAccess["busStops"][number]["lines"];
      timestamps: string[];
    }
  >();
  async function schedule(line: string) {
    const existing = scheduleCache.get(line);
    if (existing) return existing;
    const evidence = await options.cache.get(`schedule-${line}`, async () => {
      const html = await load(
        "https://www.ego.gov.tr/HareketSaatleri",
        new URLSearchParams({ hat_no1: line }).toString(),
      );
      parseSchedule(html, line);
      return html;
    });
    const result = {
      data: parseSchedule(evidence.text, line),
      fetchedAt: evidence.fetchedAt,
    };
    scheduleCache.set(line, result);
    return result;
  }
  function stopLines(text: string) {
    const body: unknown = JSON.parse(text);
    if (
      !body ||
      typeof body !== "object" ||
      !("status" in body) ||
      String(body.status).toUpperCase() !== "TRUE" ||
      !("table" in body) ||
      !Array.isArray(body.table)
    )
      throw new Error("Invalid EGO stop response");
    return [
      ...new Set(
        body.table.flatMap((row) => {
          if (!row || typeof row !== "object") return [];
          const code = row.hat_kisa_kod || row.hat_no || row.hat_kod;
          return typeof code === "string" && /^\d{2,4}(?:-\d{1,2})?$/.test(code)
            ? [code]
            : [];
        }),
      ),
    ];
  }
  async function verifiedLines(stop: string) {
    const existing = stopCache.get(stop);
    if (existing) return existing;
    const evidence = await options.cache.get(`stop-${stop}`, async () => {
      const text = await load(
        `https://egocptsrvand.ego.gov.tr/mblSrv14/service.asp?${new URLSearchParams({ FNC: "Otobusler", VER: "3.1.0", LAN: "tr", DURAK: stop })}`,
      );
      stopLines(text);
      return text;
    });
    const lines: DestinationAccess["busStops"][number]["lines"] = [];
    const timestamps = [evidence.fetchedAt];
    for (const code of stopLines(evidence.text)) {
      // A failed tariff makes the target incomplete; never delete old lines
      // merely because one upstream request failed.
      const result = await schedule(code);
      timestamps.push(result.fetchedAt);
      if (result.data.stops.some((s) => s.code === stop))
        lines.push({
          code,
          name: result.data.name,
          sourceUrl: `https://www.ego.gov.tr/HareketSaatleri?hat_no=${code}`,
        });
    }
    const result = { lines, timestamps };
    stopCache.set(stop, result);
    return result;
  }
  let changed = 0;
  for (const service of options.services) {
    const publishedPoint = getPublishedDestinationPoint(service.id);
    if (
      (service.coordinatesApproximate && !publishedPoint) ||
      service.latitude === null ||
      service.longitude === null
    )
      continue;
    const index = manifest.destinations.findIndex((target) =>
      target.serviceIds.includes(service.id),
    );
    const existing = manifest.destinations[index];
    // Preserve manual announcements/rail records and process shared venues once.
    if (
      existing &&
      (existing.serviceIds[0] !== service.id ||
        !existing.busStops.some((stop) => stop.locationSourceUrl))
    )
      continue;
    try {
      const point = {
        latitude: service.latitude,
        longitude: service.longitude,
      };
      const seen = new Set<string>();
      const nearest = stops
        .map((stop) => ({ stop, distance: geoDistance(point, stop) }))
        .filter((item) => item.distance <= 600)
        .sort((a, b) => a.distance - b.distance)
        .filter(
          (item) =>
            !seen.has(item.stop.tags.ref!) && seen.add(item.stop.tags.ref!),
        )
        .slice(0, 2);
      const busStops: DestinationAccess["busStops"] = [];
      const timestamps = [options.osm.osm3s.timestamp_osm_base];
      if (publishedPoint)
        timestamps.push(`${publishedPoint.checkedAt}T00:00:00+03:00`);
      for (const candidate of nearest) {
        const code = candidate.stop.tags.ref!;
        const result = await verifiedLines(code);
        timestamps.push(...result.timestamps);
        if (!result.lines.length) continue;
        const distanceMeters = Math.round(candidate.distance / 10) * 10;
        busStops.push({
          code,
          name: candidate.stop.tags.name || `Durak ${code}`,
          position: publishedPoint?.approximate
            ? "İzmir 2 Caddesi çevresinde"
            : `Yakında · yaklaşık ${distanceMeters} m`,
          ...(publishedPoint?.approximate ? {} : { distanceMeters }),
          locationSourceUrl: `https://www.openstreetmap.org/node/${candidate.stop.id}`,
          lines: result.lines,
        });
      }
      // Empty results may indicate limited OSM coverage or EGO failure.
      if (!busStops.length) {
        log(`Kept existing record / no verified stop: ${service.id}`);
        continue;
      }
      const target: DestinationAccess = {
        ...(existing ?? {}),
        id: existing?.id ?? service.id,
        kind: "service",
        serviceIds: existing?.serviceIds ??
          publishedPoint?.serviceIds ?? [service.id],
        name: existing?.name ?? service.name,
        address: service.address || `${service.district} / Ankara`,
        aliases: existing?.aliases ?? [],
        busStops,
        rail: existing?.rail ?? [],
        sourceUrl: publishedPoint?.sourceUrl ?? busStops[0].lines[0].sourceUrl,
        coordinateSourceUrl: service.coordinateSourceUrl,
        checkedAt: oldestEvidenceDate(timestamps),
      };
      if (index >= 0) manifest.destinations[index] = target;
      else manifest.destinations.push(target);
      changed += 1;
      log(`Verified ${service.id}: ${busStops.length} stops`);
    } catch (error) {
      log(`Kept existing record for ${service.id}: ${String(error)}`);
    }
  }
  if (changed) {
    manifest.rebuiltAt = (options.now?.() ?? new Date()).toISOString();
    manifest.updated = oldestEvidenceDate(
      manifest.destinations.map(
        (target) => `${target.checkedAt}T00:00:00+03:00`,
      ),
    );
    manifest.coordinatesAttribution = "© OpenStreetMap contributors · ODbL";
    manifest.coordinatesSnapshotAt = options.osm.osm3s.timestamp_osm_base;
    manifest.distanceMethod = "straight-line";
  }
  return { manifest, changed };
}

export async function syncMain(args = process.argv.slice(2)) {
  const flag = (name: string) => args.includes(name);
  const option = (name: string, fallback: string) =>
    args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ??
    fallback;
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const manifestPath = resolve(
    option("--manifest", "data/transport/access.json"),
  );
  const ttlHours = Number(option("--ttl-hours", "24"));
  const maxRequests = Number(option("--max-requests", "25"));
  const selectedTargets = option("--target", "").split(",").filter(Boolean);
  if (
    !Number.isFinite(ttlHours) ||
    ttlHours <= 0 ||
    !Number.isInteger(maxRequests) ||
    maxRequests < 0 ||
    maxRequests > 100
  )
    throw new Error("Invalid TTL or request budget (0–100)");
  const now = () => new Date();
  const cache = new EvidenceCache({
    directory: resolve(positional[1] || "../../work/ego-access-evidence"),
    now,
    ttlMs: ttlHours * 3600000,
    refresh: flag("--refresh"),
    offline: flag("--offline"),
    maxRequests,
  });
  const result = await rebuildDestinationAccess({
    manifest: JSON.parse(await readFile(manifestPath, "utf8")) as Manifest,
    services: selectedTargets.length
      ? services.filter((service) => selectedTargets.includes(service.id))
      : services,
    osm: JSON.parse(
      await readFile(
        resolve(positional[0] || "../../work/ego-osm-stops.json"),
        "utf8",
      ),
    ) as OsmSnapshot,
    cache,
    now,
    log: console.log,
  });
  if (result.changed) await atomicWriteJson(manifestPath, result.manifest);
  console.log(
    `Rebuilt ${result.changed} targets; ${cache.requests} upstream requests. Existing records retained on failures.`,
  );
  return result;
}
if (
  process.argv[1] &&
  /syncDestinationAccess\.(?:ts|js)$/.test(process.argv[1])
) {
  syncMain().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
