import accessData from "../data/transport/access.json";
import type { Coordinates } from "../types";
import { normalize } from "./matching";

export type DestinationAccess = {
  id: string;
  kind: "service" | "external";
  serviceIds: string[];
  name: string;
  address: string;
  aliases: string[];
  busStops: {
    code: string;
    name: string;
    position: string;
    distanceMeters?: number;
    locationSourceUrl?: string;
    lines: { code: string; name: string; sourceUrl: string }[];
  }[];
  rail: {
    code: string;
    name: string;
    station: string;
    sourceUrl: string;
  }[];
  sourceUrl: string;
  checkedAt: string;
  coordinateSourceUrl?: string;
};

// These are destination-side access points confirmed by an official source.
// They do not imply a direct journey from the user's current location.
export const destinationAccess: DestinationAccess[] =
  accessData.destinations.map((entry) => ({
    ...entry,
    kind: entry.kind === "external" ? "external" : "service",
  }));

export const externalDestinations = destinationAccess.filter(
  (entry) => entry.kind === "external",
);

export function getDestinationAccess(
  id: string,
): DestinationAccess | undefined {
  return destinationAccess.find(
    (entry) => entry.id === id || entry.serviceIds.includes(id),
  );
}

export function searchDestinations(query: string): DestinationAccess[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return destinationAccess
    .filter((entry) =>
      normalize(
        [entry.name, entry.address, ...entry.aliases].join(" "),
      ).includes(q),
    )
    .slice(0, 5);
}

export function directionsUrlForDestination(
  destination: Pick<DestinationAccess, "name" | "address">,
  origin?: Coordinates,
  mode: "transit" | "walking" = "transit",
) {
  const target = encodeURIComponent(
    `${destination.name} ${destination.address}`,
  );
  return (
    `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=${mode}` +
    (origin ? `&origin=${origin.latitude},${origin.longitude}` : "")
  );
}
