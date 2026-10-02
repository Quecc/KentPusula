import test from "node:test";
import assert from "node:assert/strict";
import {
  directionsUrlForDestination,
  getDestinationAccess,
  searchDestinations,
} from "../services/destinationAccess";

test("access search resolves aliases and service ids without guessing unknown routes", () => {
  const library = searchDestinations("cumhurbaskanligi")[0];
  assert.equal(library.id, "millet-kutuphanesi");
  assert.equal(library.name, "Cumhurbaşkanlığı Millet Kütüphanesi");
  assert.deepEqual(
    library.busStops.map((stop) => [
      stop.code,
      ...stop.lines.map((line) => line.code),
    ]),
    [
      ["13123", "167", "449"],
      ["11415", "339-7", "479"],
    ],
  );
  assert.equal(getDestinationAccess("wifi-odtu")?.rail[0].station, "ODTÜ");
  assert.equal(getDestinationAccess("unknown-place"), undefined);
  assert.deepEqual(searchDestinations("c"), []);
});

test("external destinations use their full address and only a supplied origin", () => {
  const library = getDestinationAccess("millet-kutuphanesi")!;
  const url = new URL(directionsUrlForDestination(library));
  assert.equal(
    url.searchParams.get("destination"),
    `${library.name} ${library.address}`,
  );
  assert.equal(url.searchParams.get("origin"), null);
  assert.equal(url.searchParams.get("travelmode"), "transit");
  const walking = new URL(
    directionsUrlForDestination(
      library,
      { latitude: 39.9, longitude: 32.8 },
      "walking",
    ),
  );
  assert.equal(walking.searchParams.get("origin"), "39.9,32.8");
  assert.equal(walking.searchParams.get("travelmode"), "walking");
});
