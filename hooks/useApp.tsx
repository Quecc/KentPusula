import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState as NativeAppState } from "react-native";
import {
  CityPlan,
  Preferences,
  Profile,
  SavedEntry,
  SavedGroup,
} from "../types";
import { DEMO_DATE } from "../data/catalog";

const KEY = "kentpusula:v1";
const STORAGE_VERSION = 3;
const defaults: Preferences = {
  theme: "light",
  highContrast: false,
  largeText: false,
  demo: false,
};
type AppState = {
  profile: Profile;
  setProfile: (p: Profile) => void;
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  saved: SavedEntry[];
  toggleSaved: (id: string) => void;
  moveSaved: (id: string, group: SavedGroup) => void;
  onboarded: boolean;
  finishOnboarding: () => void;
  ready: boolean;
  plan: CityPlan | null;
  setPlan: (plan: CityPlan | null) => void;
  now: Date;
  notice: string;
  setNotice: (s: string) => void;
};
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>({ interests: [] });
  const [preferences, setPreferences] = useState(defaults);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<CityPlan | null>(null);
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    const listener = NativeAppState.addEventListener("change", (state) => {
      if (state === "active") setTick(Date.now());
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const data = JSON.parse(raw);
        if (![1, 2, STORAGE_VERSION].includes(data.version)) return;
        if (data.profile && Array.isArray(data.profile.interests))
          setProfile(data.profile);
        if (data.preferences) {
          const stored = { ...defaults, ...data.preferences };
          // Earlier builds followed the phone theme by default. Migrate that
          // default once so web and mobile open with the same light palette.
          if (data.version === 1 && stored.theme === "system")
            stored.theme = "light";
          // Older builds enabled a presentation clock by default. Switch once
          // to actual time; future explicit demo choices remain available.
          if (data.version < STORAGE_VERSION) stored.demo = false;
          setPreferences(stored);
        }
        if (Array.isArray(data.saved))
          setSaved(
            data.saved.filter(
              (s: SavedEntry) =>
                typeof s.id === "string" && typeof s.group === "string",
            ),
          );
        setOnboarded(data.onboarded === true);
      })
      .catch(() => {
        if (alive)
          setNotice("Yerel kayıtlar okunamadı. Bu oturumda devam edebilirsin.");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Debounce so rapid preference changes never race older writes.
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          profile: { ...profile, location: undefined },
          preferences,
          saved,
          onboarded,
        }),
      ).catch(() =>
        setNotice(
          "Değişiklikler cihaza kaydedilemedi. Depolama alanını kontrol et.",
        ),
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [profile, preferences, saved, onboarded, ready]);
  const now = useMemo(
    () => new Date(preferences.demo ? DEMO_DATE : tick),
    [preferences.demo, tick],
  );
  return (
    <Context.Provider
      value={{
        profile,
        setProfile,
        preferences,
        setPreferences,
        saved,
        toggleSaved: (id) =>
          setSaved((prev) =>
            prev.some((s) => s.id === id)
              ? prev.filter((s) => s.id !== id)
              : [...prev, { id, group: "Sonra bakacağım" }],
          ),
        moveSaved: (id, group) =>
          setSaved((prev) =>
            prev.map((s) => (s.id === id ? { ...s, group } : s)),
          ),
        onboarded,
        finishOnboarding: () => setOnboarded(true),
        ready,
        plan,
        setPlan,
        now,
        notice,
        setNotice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is required");
  return value;
}
