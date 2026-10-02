import test from "node:test";
import assert from "node:assert/strict";
import { services } from "../data/catalog";
import points from "../data/transport/accessPoints.json";
import { applyPublishedDestinationPoint } from "../services/destinationPoint";
import { distanceKm } from "../services/matching";
import type { CityService } from "../types";

test("catalog and distance consumers use the same published meal point", () => {
  for (const point of points.points) {
    const service = services.find((entry) => entry.id === point.serviceId)!;
    assert.equal(service.latitude, point.latitude);
    assert.equal(service.longitude, point.longitude);
    assert.equal(service.coordinateSourceUrl, point.coordinateSourceUrl);
    assert.equal(service.coordinatesApproximate, point.approximate);
    assert.equal(
      distanceKm(
        { latitude: service.latitude!, longitude: service.longitude! },
        point,
      ),
      0,
    );
  }
  const food = services.find((entry) => entry.id === "food-kizilay")!;
  const library = services.find((entry) => entry.id === "study-yuzuncuyil")!;
  assert.deepEqual(
    [library.latitude, library.longitude],
    [food.latitude, food.longitude],
  );
  assert.equal(library.coordinatesApproximate, true);
  assert.equal(library.sourceStatus, "historical");
});

test("coordinate correction does not mutate or falsely verify service metadata", () => {
  const original: CityService = {
    ...services.find((entry) => entry.id === "food-anittepe")!,
    latitude: 39.9238,
    longitude: 32.8394,
    coordinatesApproximate: true,
    sourceStatus: "historical",
    sourceCheckedAt: "2024-01-01",
    verifiedAt: null,
    sourceNote: "Saatler teyit edilmeli. Konum yaklaşık.",
  };
  const before = structuredClone(original);
  const corrected = applyPublishedDestinationPoint(original);
  assert.deepEqual(original, before);
  assert.notEqual(corrected, original);
  assert.equal(corrected.latitude, 39.93316);
  assert.equal(corrected.coordinatesApproximate, false);
  assert.equal(corrected.sourceStatus, "historical");
  assert.equal(corrected.sourceCheckedAt, "2024-01-01");
  assert.equal(corrected.verifiedAt, null);
  assert.equal(corrected.sourceNote, "Saatler teyit edilmeli.");
});
