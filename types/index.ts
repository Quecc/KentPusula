export type Category =
  | "food"
  | "study"
  | "wifi"
  | "sport"
  | "course"
  | "career"
  | "culture"
  | "support";
export type Coordinates = { latitude: number; longitude: number };
export type Hours = { days: number[]; open: string; close: string };
export interface CityService {
  id: string;
  name: string;
  description: string;
  category: Category;
  provider: string;
  latitude: number | null;
  longitude: number | null;
  district: string;
  address: string;
  eligibility: string;
  ageMin: number | null;
  ageMax: number | null;
  studentRequired: boolean;
  documents: string[];
  openingHours: Hours[] | null;
  applicationRequired: boolean | null;
  applicationUrl: string | null;
  officialSourceUrl: string;
  phone: string | null;
  verifiedAt: string | null;
  sourceCheckedAt: string;
  lastUpdatedAt: string;
  tags: string[];
  isFree: boolean | null;
  coordinateSourceUrl?: string;
  sourceStatus: "source-backed" | "historical";
  sourceNote: string;
  coordinatesApproximate: boolean;
  applicationDeadline?: string;
}
export interface Profile {
  age?: number;
  student?: boolean;
  location?: Coordinates;
  interests: Category[];
}
export interface Intent {
  categories: Category[];
  age?: number;
  student?: boolean;
  durationMinutes: number;
  dayOffset: number;
  text: string;
}
export interface Match {
  service: CityService;
  score: number;
  reasons: string[];
  cautions: string[];
  distance: number | null;
  eligible: boolean;
}
export interface PlanStop {
  match: Match;
  startMinute: number;
  durationMinutes: number;
  travelMinutes: number;
  provisional: boolean;
}
export interface CityPlan {
  stops: PlanStop[];
  warnings: string[];
  intent: Intent;
  date: string;
  demo: boolean;
}
export type Tab = "home" | "discover" | "compass" | "map" | "saved";
export type SavedGroup =
  "Ders çalışma" | "Kariyer" | "Yemek" | "Sonra bakacağım";
export type SavedEntry = { id: string; group: SavedGroup };
export type Preferences = {
  theme: "system" | "light" | "dark";
  largeText: boolean;
  highContrast: boolean;
  demo: boolean;
};
