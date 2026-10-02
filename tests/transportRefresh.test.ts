import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EvidenceCache, atomicWriteJson } from "../scripts/transportEvidence";
import {
  rebuildDestinationAccess,
  Manifest,
  OsmSnapshot,
} from "../scripts/syncDestinationAccess";
import { services } from "../data/catalog";
import access from "../data/transport/access.json";

const at = (date: string) => () => new Date(date);
const fixtureDate = "2026-10-02T10:00:00Z";
const service = {
  ...services[0],
  id: "fixture-place",
  latitude: 39.9,
  longitude: 32.8,
  coordinatesApproximate: false,
};
const osm: OsmSnapshot = {
  osm3s: { timestamp_osm_base: fixtureDate },
  elements: [
    { id: 1, lat: 39.9, lon: 32.8, tags: { ref: "12345", name: "Test durak" } },
  ],
};
const initial: Manifest = {
  updated: "2026-10-01",
  destinations: [
    {
      id: service.id,
      kind: "service",
      serviceIds: [service.id],
      name: service.name,
      address: service.address,
      aliases: [],
      busStops: [
        {
          code: "12345",
          name: "Test durak",
          position: "Yakında",
          locationSourceUrl: "https://www.openstreetmap.org/node/1",
          lines: [
            {
              code: "100",
              name: "Eski hat",
              sourceUrl: "https://www.ego.gov.tr/",
            },
          ],
        },
      ],
      rail: [],
      sourceUrl: "https://www.ego.gov.tr/",
      checkedAt: "2026-10-01",
    },
  ],
};
const tariff =
  '<tr><td>Hat Adı</td><td>:</td><td>Yeni hat</td></tr><td class="hs-times">06:00<br></td><td class="hs-times">07:00<br></td><td class="hs-times">08:00<br></td><table class="route-table"><tr><td>1</td><td>12345</td><td>Test durak</td><td>Adres</td></tr></table>';
const fetchFixture = async (url: string) =>
  url.includes("service.asp")
    ? JSON.stringify({ status: "TRUE", table: [{ hat_no: "200" }] })
    : tariff;

test("evidence TTL and forced refresh replace stale data without retimestamping a cache hit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kent-ttl-"));
  try {
    let calls = 0;
    const load = async () => {
      calls += 1;
      return `payload-${calls}`;
    };
    const options = { directory, ttlMs: 3600000, now: at(fixtureDate) };
    const first = await new EvidenceCache(options).get("schedule-100", load);
    const hit = await new EvidenceCache({
      ...options,
      now: at("2026-10-02T10:10:00Z"),
    }).get("schedule-100", load);
    assert.deepEqual(hit, first);
    assert.equal(calls, 1);
    await new EvidenceCache({
      ...options,
      now: at("2026-10-02T12:00:00Z"),
    }).get("schedule-100", load);
    assert.equal(calls, 2);
    await new EvidenceCache({
      ...options,
      now: at("2026-10-02T12:10:00Z"),
      refresh: true,
    }).get("schedule-100", load);
    assert.equal(calls, 3);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a second rebuild refreshes an existing target and failed refresh keeps all verified lines", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kent-rebuild-"));
  try {
    const cache = new EvidenceCache({
      directory,
      ttlMs: 86400000,
      now: at(fixtureDate),
      refresh: true,
    });
    const result = await rebuildDestinationAccess({
      manifest: initial,
      services: [service],
      osm,
      cache,
      fetchText: fetchFixture,
      now: at(fixtureDate),
    });
    assert.equal(result.changed, 1);
    assert.equal(result.manifest.destinations.length, 1);
    assert.equal(
      result.manifest.destinations[0].busStops[0].lines[0].code,
      "200",
    );
    assert.equal(initial.destinations[0].busStops[0].lines[0].code, "100");
    const second = await rebuildDestinationAccess({
      manifest: result.manifest,
      services: [service],
      osm,
      cache: new EvidenceCache({
        directory,
        ttlMs: 86400000,
        now: at("2026-10-03T10:00:00Z"),
        refresh: true,
      }),
      fetchText: async (url) =>
        url.includes("service.asp")
          ? JSON.stringify({ status: "TRUE", table: [{ hat_no: "300" }] })
          : tariff,
      now: at("2026-10-03T10:00:00Z"),
    });
    assert.equal(second.changed, 1);
    assert.equal(
      second.manifest.destinations[0].busStops[0].lines[0].code,
      "300",
    );
    assert.equal(second.manifest.destinations.length, 1);
    const failed = await rebuildDestinationAccess({
      manifest: second.manifest,
      services: [service],
      osm,
      cache: new EvidenceCache({
        directory,
        ttlMs: 86400000,
        now: at("2026-10-03T10:00:00Z"),
        refresh: true,
      }),
      fetchText: async () => {
        throw new Error("EGO unavailable");
      },
    });
    assert.equal(failed.changed, 0);
    assert.deepEqual(failed.manifest, second.manifest);
    assert.equal(initial.updated, "2026-10-01");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("offline rebuild uses actual evidence date while preserving missing targets and manual records", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kent-offline-"));
  try {
    await atomicWriteJson(join(directory, "stop-12345.evidence.json"), {
      text: JSON.stringify({ status: "TRUE", table: [{ hat_no: "200" }] }),
      fetchedAt: fixtureDate,
    });
    await atomicWriteJson(join(directory, "schedule-200.evidence.json"), {
      text: tariff,
      fetchedAt: fixtureDate,
    });
    const later = at("2026-11-02T10:00:00Z");
    const manual = structuredClone(access.destinations[0]);
    const result = await rebuildDestinationAccess({
      manifest: {
        ...initial,
        destinations: [
          ...initial.destinations,
          { ...manual, kind: "external" },
        ],
      },
      services: [service],
      osm,
      cache: new EvidenceCache({
        directory,
        ttlMs: 1,
        now: later,
        offline: true,
      }),
      fetchText: async () => {
        throw new Error("Must not fetch offline");
      },
      now: later,
    });
    assert.equal(result.manifest.destinations[0].checkedAt, "2026-10-02");
    assert.equal(result.manifest.updated, "2026-10-02");
    assert.equal(result.manifest.rebuiltAt, "2026-11-02T10:00:00.000Z");
    assert.deepEqual(result.manifest.destinations[1], manual);
    const empty = await rebuildDestinationAccess({
      manifest: result.manifest,
      services: [service],
      osm: { ...osm, elements: [] },
      cache: new EvidenceCache({
        directory,
        ttlMs: 1,
        now: later,
        offline: true,
      }),
    });
    assert.deepEqual(empty.manifest, result.manifest);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("request budget is bounded and atomic output retains valid JSON with no partial files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kent-atomic-"));
  try {
    const path = join(directory, "access.json");
    await atomicWriteJson(path, initial);
    await atomicWriteJson(path, { ...initial, updated: "2026-10-02" });
    assert.equal(
      JSON.parse(await readFile(path, "utf8")).updated,
      "2026-10-02",
    );
    await assert.rejects(atomicWriteJson(path, { invalid: 1n }), /BigInt/);
    assert.equal(
      JSON.parse(await readFile(path, "utf8")).updated,
      "2026-10-02",
    );
    assert.deepEqual(await readdir(directory), ["access.json"]);
    const cache = new EvidenceCache({
      directory,
      ttlMs: 1,
      now: at(fixtureDate),
      maxRequests: 1,
    });
    await cache.get("first", async () => "one");
    await assert.rejects(
      cache.get("second", async () => "two"),
      /budget reached/,
    );
    assert.equal(cache.requests, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  assert.equal(access.destinations.length, 41);
  assert.equal(
    access.destinations
      .flatMap((target) => target.busStops)
      .flatMap((stop) => stop.lines).length,
    565,
  );
});
