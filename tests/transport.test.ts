import test from "node:test";
import assert from "node:assert/strict";
import { parseArrivals, parseLines, parseSchedule } from "../server/ego";
import places from "../data/places.json";
import stops from "../data/transport/stops.json";

test("official line options retain variants and decode Turkish HTML entities", () => {
  assert.deepEqual(
    parseLines(
      '<option value="">Seç</option><option value="481-1">KE&#199;İ&#214;REN</option>',
    ),
    [{ code: "481-1", name: "KEÇİÖREN" }],
  );
  assert.throws(() => parseLines("maintenance"));
});
test("schedule notes with additional times are not additional departures", () => {
  const html =
    "<tr><td>Hat Adı</td><td>:</td><td>UYANIŞ</td></tr>" +
    '<td class="hs-times">06:17 21071DEN BAŞLAR /KARAPINARDAN 06:50<br>06:20 -<br></td>' +
    '<td class="hs-times">07:00 -</td><td class="hs-times"></td>' +
    '<table class="table route-table"><tr><td>1</td><td>40010</td><td>GÜLBABA</td><td>Adres</td></tr></table>';
  const s = parseSchedule(html, "481");
  assert.equal(s.days[0].departures.length, 2);
  assert.equal(
    s.days[0].departures[0].note,
    "21071DEN BAŞLAR /KARAPINARDAN 06:50",
  );
  assert.equal(s.days[2].departures.length, 0);
  assert.equal(s.stops[0].code, "40010");
  assert.throws(() => parseSchedule("unavailable", "481"));
});
test("scheduled, missing and passed vehicles never get a live countdown", () => {
  const rows = parseArrivals(
    {
      status: "TRUE",
      table: [
        { hat_no: "481", arac_no: "-", sure: "06:20", saniye: "120" },
        {
          hat_no: "481",
          arac_no: "1",
          plaka_no: "06 TEST 01",
          saniye: "90",
          konum_tarihi: "01.10.2026 18:10:00",
        },
        {
          hat_no: "481",
          arac_no: "1",
          plaka_no: "06 TEST 01",
          saniye: "999999",
        },
        { hat_no: "481", arac_no: "1", saniye: "", sure: "" },
      ],
    },
    Date.parse("2026-10-01T18:11:00+03:00"),
  );
  assert.equal(rows.length, 3);
  assert.equal(rows.find((row) => row.kind === "scheduled")?.minutes, null);
  assert.equal(rows.find((row) => row.kind === "live")?.minutes, 2);
  assert.equal(rows.find((row) => row.kind === "unknown")?.minutes, null);
  assert.throws(() => parseArrivals({ status: "FALSE", table: [] }));
});
test("old vehicle locations do not masquerade as fresh arrivals", () => {
  const row = {
    hat_no: "481",
    arac_no: "1",
    plaka_no: "06 TEST",
    saniye: "60",
    konum_tarihi: "01.10.2026 17:00:00",
  };
  assert.equal(
    parseArrivals(
      { status: "TRUE", table: [row] },
      Date.parse("2026-10-01T18:00:00+03:00"),
    )[0].minutes,
    null,
  );
});
test("inactive notices are hidden and live arrivals are ordered by ETA", () => {
  const at = Date.parse("2026-10-01T23:34:00+03:00");
  const vehicle = (line: string, seconds: string) => ({
    hat_no: line,
    arac_no: "1",
    plaka_no: `06 TEST ${line}`,
    saniye: seconds,
    sure: `${Math.ceil(Number(seconds) / 60)} dk`,
    konum_tarihi: "01.10.2026 23:33:00",
  });
  const rows = parseArrivals(
    {
      status: "TRUE",
      table: [
        {
          hat_no: "112-1",
          arac_no: "-",
          sure: "Hattın Bugün İçin Başka Servisi Yok",
        },
        {
          hat_no: "112-1",
          arac_no: "-",
          sure: "Bugün İçin Son Hareket Saati\n20:45",
        },
        {
          hat_no: "183-6",
          arac_no: "-",
          sure: "Sonraki Hareket Saati İlk Duraktan\n24:30 / 56 dk Sonra",
        },
        vehicle("481", "960"),
        vehicle("454", "0"),
        vehicle("439", "240"),
      ],
    },
    at,
  );
  assert.deepEqual(
    rows.map((row) => [row.line, row.kind, row.minutes]),
    [
      ["454", "live", 0],
      ["439", "live", 4],
      ["481", "live", 16],
      ["183-6", "scheduled", null],
    ],
  );
});
test("new municipal map points have provenance, plausible bounds and no duplicate coordinates", () => {
  assert.equal(places.length, 36);
  assert.equal(
    new Set(places.map((p) => `${p.latitude},${p.longitude}`)).size,
    36,
  );
  for (const place of places) {
    assert.ok(place.latitude > 39.5 && place.latitude < 40.5, place.name);
    assert.ok(place.longitude > 32 && place.longitude < 33.5, place.name);
    assert.match(
      place.coordinateSourceUrl,
      /^https:\/\/(www\.ankara|kentrehberi\.cankaya)\.bel\.tr\//,
    );
    assert.equal(place.isFree, null);
  }
});
test("bundled OSM stop snapshot contains only searchable names and identifiers", () => {
  assert.equal(stops.stops.length, 2943);
  assert.equal(new Set(stops.stops.map((s) => s.r)).size, 2943);
  assert.ok(stops.stops.every((s) => /^\d{5}$/.test(s.r)));
});
