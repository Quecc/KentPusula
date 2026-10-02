import test from "node:test";
import assert from "node:assert/strict";
import {
  arrivalResponseFresh,
  remainingDepartures,
  scheduleDay,
} from "../services/transportTime";

test("tariff day uses Ankara even across a UTC midnight boundary", () => {
  assert.equal(scheduleDay(new Date("2026-10-02T22:30:00Z")), 1);
  assert.equal(scheduleDay(new Date("2026-10-03T22:30:00Z")), 2);
  assert.equal(scheduleDay(new Date("2026-10-04T22:30:00Z")), 0);
});
test("late-night tariff shows remaining departures and no next-day morning times", () => {
  const departures = ["05:00", "06:30", "23:30", "23:45"].map((time) => ({
    time,
    note: "",
  }));
  assert.deepEqual(
    remainingDepartures(departures, new Date("2026-10-02T23:30:00+03:00")).map(
      (entry) => entry.time,
    ),
    ["23:30", "23:45"],
  );
  assert.deepEqual(
    remainingDepartures(departures, new Date("2026-10-02T23:46:00+03:00")),
    [],
  );
});
test("expired or invalid arrival responses cannot keep a live minute label", () => {
  const fetched = "2026-10-02T20:30:00Z";
  const at = Date.parse(fetched);
  assert.equal(arrivalResponseFresh(fetched, at + 59999), true);
  assert.equal(arrivalResponseFresh(fetched, at + 60000), false);
  assert.equal(arrivalResponseFresh("invalid", at), false);
  assert.equal(arrivalResponseFresh(fetched, at - 31000), false);
});
