import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { services } from "../../../data/catalog";
import { Empty } from "../../../components/ui";
import { Transport } from "../../../features/Transport";
import { useTheme } from "../../../theme";
import { getDestinationAccess } from "../../../services/destinationAccess";
export default function TransportRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const service = services.find((s) => s.id === id);
  const destination = getDestinationAccess(id);
  const target =
    service ??
    (destination
      ? {
          id: destination.id,
          name: destination.name,
          address: destination.address,
          latitude: null,
          longitude: null,
          coordinatesApproximate: true,
        }
      : undefined);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {target ? (
        <Transport key={target.id} service={target} />
      ) : (
        <Empty
          title="Hizmet bulunamadı"
          description="Keşfet’ten bir hizmet seçerek yol tarifini açabilirsin."
          action="Keşfet’e dön"
          onPress={() => router.replace("/discover")}
        />
      )}
    </SafeAreaView>
  );
}
