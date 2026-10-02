import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import * as Location from "expo-location";
import { Category, CityService } from "../types";
import { categories, DEFAULT_LOCATION, services } from "../data/catalog";
import { useApp } from "../hooks/useApp";
import { useTheme } from "../theme";
import { Badge, Button, Chip, Empty, Txt } from "../components/ui";
import { ServiceMap } from "../components/ServiceMap";
import { openingStatus } from "../utils/time";
import { distanceKm } from "../services/matching";

export function MapScreen({
  target,
  onDetail,
}: {
  target?: CityService;
  onDetail: (s: CityService) => void;
}) {
  const { colors } = useTheme();
  const { profile, setProfile, setNotice, now } = useApp();
  const [locating, setLocating] = useState(false);
  const [category, setCategory] = useState<Category>(),
    [selected, setSelected] = useState<CityService | undefined>(target),
    [showAll, setShowAll] = useState(false);
  const origin = profile.location ?? DEFAULT_LOCATION;
  const items = services.filter(
    (s) => s.latitude !== null && (!category || s.category === category),
  );
  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice(
          "Konum izni verilmedi. Ankara merkezine göre keşfedebilirsin.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setProfile({
        ...profile,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
    } catch {
      setNotice("Konum alınamadı. Cihazının konum ayarlarını kontrol et.");
    } finally {
      setLocating(false);
    }
  }
  const nearby = [...items].sort((a, b) => {
    const point = (service: CityService) => ({
      latitude: service.latitude!,
      longitude: service.longitude!,
    });
    return distanceKm(origin, point(a)) - distanceKm(origin, point(b));
  });
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 6 }}>
        <Txt accessibilityRole="header" size={38} weight="700">
          Harita
        </Txt>
        <Txt muted>
          {profile.location
            ? "Konumunun çevresindeki hizmetler."
            : "Ankara merkezine göre hizmetler."}
        </Txt>
      </View>
      {!profile.location && (
        <Button
          label={locating ? "Konum alınıyor…" : "Konumumu kullan"}
          icon="locate-outline"
          variant="secondary"
          disabled={locating}
          onPress={() => {
            void locate();
          }}
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 20 }}
      >
        <Chip
          label="Tümü"
          selected={!category}
          onPress={() => {
            setCategory(undefined);
            setSelected(undefined);
            setShowAll(false);
          }}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={category === c.id}
            onPress={() => {
              setCategory(c.id);
              setSelected(undefined);
              setShowAll(false);
            }}
          />
        ))}
      </ScrollView>
      <ServiceMap
        items={items}
        center={origin}
        selected={selected?.id}
        onSelect={setSelected}
      />
      {selected && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 18,
            backgroundColor: colors.panel,
            padding: 22,
            gap: 13,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Txt size={23} weight="700" style={{ flex: 1 }}>
              {selected.name}
            </Txt>
            <Badge
              text={
                selected.isFree === true ? "Ücretsiz" : "Ücret teyidi gerekli"
              }
            />
          </View>
          <Txt size={13}>
            {openingStatus(selected, now).label}
            {selected.latitude !== null && selected.longitude !== null
              ? ` · ${profile.location ? "Yaklaşık" : "Ankara merkezinden"} ${distanceKm(origin, { latitude: selected.latitude, longitude: selected.longitude }).toFixed(1)} km`
              : ""}
          </Txt>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              label="Yol tarifi"
              icon="bus-outline"
              onPress={() =>
                router.push({
                  pathname: "/transport/[id]",
                  params: { id: selected.id },
                })
              }
            />
            <Button
              label="Ayrıntılar"
              variant="secondary"
              onPress={() => onDetail(selected)}
            />
          </View>
        </View>
      )}
      <View style={{ gap: 5 }}>
        <Txt size={22} weight="700">
          {profile.location
            ? "Yakındaki yerler"
            : "Ankara merkezine yakın yerler"}
        </Txt>
        <Txt size={13} muted>
          {items.length} harita noktası
        </Txt>
      </View>
      <Button
        label="Cumhurbaşkanlığı Millet Kütüphanesi’ne ulaşım"
        icon="bus-outline"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/transport/[id]",
            params: { id: "millet-kutuphanesi" },
          })
        }
      />
      {!items.length && (
        <Empty
          title="Bu kategoride konumu teyitli nokta yok."
          description="Başka bir kategori seçerek haritadaki hizmetleri görebilirsin."
          action="Tüm noktaları göster"
          onPress={() => setCategory(undefined)}
        />
      )}
      {nearby.slice(0, showAll ? undefined : 5).map((s) => (
        <Button
          key={s.id}
          label={s.name}
          variant="secondary"
          icon="location-outline"
          onPress={() => setSelected(s)}
        />
      ))}
      {nearby.length > 5 && (
        <Button
          label={
            showAll ? "Daha az göster" : `Tümünü göster (${nearby.length})`
          }
          variant="ghost"
          onPress={() => setShowAll((value) => !value)}
        />
      )}
    </View>
  );
}
