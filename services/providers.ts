import { CityService, Intent } from "../types";
import { services, DEMO_QUERY } from "../data/catalog";
import { parseIntent } from "./matching";

export interface ServiceRepository {
  list(): Promise<CityService[]>;
  get(id: string): Promise<CityService | undefined>;
}
export const localRepository: ServiceRepository = {
  list: async () => services,
  get: async (id) => services.find((s) => s.id === id),
};
export interface IntentProvider {
  analyze(text: string): Promise<Intent>;
  mode: "local" | "remote";
}
export const localIntentProvider: IntentProvider = {
  mode: "local",
  analyze: async (text) => parseIntent(text),
};
export interface VoiceProvider {
  mode: "demo" | "live";
  transcribe(): Promise<string>;
}
export const demoVoiceProvider: VoiceProvider = {
  mode: "demo",
  transcribe: async () => DEMO_QUERY,
};
