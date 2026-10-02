import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Detail } from "../../../features/Detail";
import { services } from "../../../data/catalog";
import { Empty } from "../../../components/ui";
import { useTheme } from "../../../theme";
export default function ServiceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const service = services.find((s) => s.id === id);
  const close = () =>
    router.canGoBack() ? router.back() : router.replace("/home");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {service ? (
        <Detail
          service={service}
          onClose={close}
          onMap={() =>
            router.replace({
              pathname: "/[tab]",
              params: { tab: "map", target: service.id },
            })
          }
        />
      ) : (
        <Empty
          title="Bu hizmet bulunamadı."
          description="Bağlantı eski olabilir. Katalogdaki hizmetleri keşfedebilirsin."
          action="Keşfet’e dön"
          onPress={() => router.replace("/discover")}
        />
      )}
    </SafeAreaView>
  );
}
