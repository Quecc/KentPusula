import { useColorScheme } from "react-native";
import { useApp } from "../hooks/useApp";
export const light = {
  bg: "#F5F5F2",
  panel: "#FFFFFF",
  ink: "#172421",
  muted: "#68716C",
  line: "#E2E4DF",
  accent: "#C24728",
  accentSoft: "#FAEAE3",
  green: "#216849",
  greenSoft: "#E8F0E8",
  hero: "#243D34",
  heroText: "#F9F6EA",
  map: "#E8EBE5",
  white: "#FFFFFF",
};
export type Palette = typeof light;
const dark: Palette = {
  bg: "#13201E",
  panel: "#1B2D29",
  ink: "#F1F1E5",
  muted: "#B9C6BD",
  line: "#40534A",
  accent: "#FFAC86",
  accentSoft: "#503226",
  green: "#B3DBB4",
  greenSoft: "#263F30",
  hero: "#304B3E",
  heroText: "#F9F6EA",
  map: "#2C3C33",
  white: "#FFFFFF",
};
export function useTheme() {
  const system = useColorScheme();
  const { preferences } = useApp();
  const isDark =
    preferences.theme === "dark" ||
    (preferences.theme === "system" && system === "dark");
  const colors = { ...(isDark ? dark : light) };
  if (preferences.highContrast) {
    colors.muted = colors.ink;
    colors.line = isDark ? "#9BAC9F" : "#55645B";
  }
  return { colors, isDark, scale: preferences.largeText ? 1.2 : 1 };
}
