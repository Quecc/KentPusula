import accessPoints from "../data/transport/accessPoints.json";
import type { CityService } from "../types";

// Only published coordinate evidence is applied here. A new map point must
// never change the verification status of opening hours or service availability.
export function getPublishedDestinationPoint(serviceId: string) {
  return accessPoints.points.find(
    (point) =>
      point.serviceId === serviceId || point.serviceIds?.includes(serviceId),
  );
}

export function applyPublishedDestinationPoint(
  service: CityService,
): CityService {
  const point = getPublishedDestinationPoint(service.id);
  if (!point) return service;
  return {
    ...service,
    latitude: point.latitude,
    longitude: point.longitude,
    address: point.address,
    coordinatesApproximate: point.approximate,
    coordinateSourceUrl: point.coordinateSourceUrl,
    sourceNote: point.approximate
      ? service.sourceNote
      : service.sourceNote.replace(/\s*Konum yaklaşık\./g, "").trim(),
  };
}
