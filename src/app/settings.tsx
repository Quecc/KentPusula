import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings } from "../../features/Settings";
import { useTheme } from "../../theme";
export default function SettingsRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Settings
        onClose={() =>
          router.canGoBack() ? router.back() : router.replace("/home")
        }
      />
    </SafeAreaView>
  );
}
