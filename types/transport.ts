export type EgoLine = { code: string; name: string };
export type EgoStop = { code: string; name: string };
export type Departure = { time: string; note: string };
export type Schedule = {
  line: string;
  name: string;
  origin: string;
  destination: string;
  days: { label: string; departures: Departure[] }[];
  stops: { order: number; code: string; name: string; address: string }[];
};
export type Arrival = {
  line: string;
  destination: string;
  minutes: number | null;
  kind: "live" | "scheduled" | "unknown";
  description: string;
  vehicleUpdatedAt: string | null;
};
export type TransportResponse<T> = {
  data: T;
  fetchedAt: string;
  source: string;
};
