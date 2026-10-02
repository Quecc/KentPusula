import React, { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { CityService, Coordinates } from "../types";
import { Badge, Icon, IconButton, Txt } from "./ui";
import { useTheme } from "../theme";
import { categories } from "../data/catalog";
import { openLink } from "../utils/links";
import { useApp } from "../hooks/useApp";

const TILE = 256;
function project(lat: number, lon: number, zoom: number) {
  const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  const world = TILE * 2 ** zoom;
  return {
    x: ((lon + 180) / 360) * world,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
  };
}
export function ServiceMap({
  items,
  center,
  selected,
  onSelect,
}: {
  items: CityService[];
  center: Coordinates;
  selected?: string;
  onSelect: (s: CityService) => void;
}) {
  const { colors } = useTheme();
  const { setNotice } = useApp();
  const [width, setWidth] = useState(500),
    [zoom, setZoom] = useState(13),
    [shift, setShift] = useState({ x: 0, y: 0 }),
    [tileState, setTileState] = useState<Record<string, boolean>>({});
  const [viewportCenter, setViewportCenter] = useState(() => {
    const point = items.find((item) => item.id === selected);
    return point?.latitude != null && point.longitude != null
      ? { latitude: point.latitude, longitude: point.longitude }
      : center;
  });
  const [previous, setPrevious] = useState({
    latitude: center.latitude,
    longitude: center.longitude,
    selected,
  });
  const height = 400;
  const p = project(viewportCenter.latitude, viewportCenter.longitude, zoom);
  const origin = {
    x: p.x - width / 2 + shift.x,
    y: p.y - height / 2 + shift.y,
  };
  const centerChanged =
    previous.latitude !== center.latitude ||
    previous.longitude !== center.longitude;
  if (centerChanged || previous.selected !== selected) {
    setPrevious({
      latitude: center.latitude,
      longitude: center.longitude,
      selected,
    });
    if (centerChanged) {
      setViewportCenter(center);
      setShift({ x: 0, y: 0 });
    }
    const point = items.find((item) => item.id === selected);
    if (!centerChanged && point?.latitude != null && point.longitude != null) {
      const position = project(point.latitude, point.longitude, zoom);
      if (
        position.x < origin.x ||
        position.x > origin.x + width ||
        position.y < origin.y ||
        position.y > origin.y + height
      ) {
        setViewportCenter({
          latitude: point.latitude,
          longitude: point.longitude,
        });
        setShift({ x: 0, y: 0 });
      }
    }
  }
  const tiles = useMemo(() => {
    const result: { x: number; y: number }[] = [];
    for (
      let x = Math.floor(origin.x / TILE);
      x <= Math.floor((origin.x + width) / TILE);
      x++
    )
      for (
        let y = Math.floor(origin.y / TILE);
        y <= Math.floor((origin.y + height) / TILE);
        y++
      )
        result.push({ x, y });
    return result;
  }, [origin.x, origin.y, width]);
  const allTilesFailed =
    tiles.length > 0 &&
    tiles.every((tile) => tileState[`${zoom}/${tile.x}/${tile.y}`] === false);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height,
        backgroundColor: colors.map,
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      {tiles.map((t) => (
        <Image
          key={`${zoom}/${t.x}/${t.y}`}
          accessibilityIgnoresInvertColors
          source={{
            uri: `https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`,
          }}
          onLoad={() =>
            setTileState((state) => ({
              ...state,
              [`${zoom}/${t.x}/${t.y}`]: true,
            }))
          }
          onError={() =>
            setTileState((state) => ({
              ...state,
              [`${zoom}/${t.x}/${t.y}`]: false,
            }))
          }
          style={{
            position: "absolute",
            width: TILE,
            height: TILE,
            left: t.x * TILE - origin.x,
            top: t.y * TILE - origin.y,
          }}
        />
      ))}
      {items
        .filter((s) => s.latitude !== null && s.longitude !== null)
        .map((s) => {
          const pos = project(s.latitude!, s.longitude!, zoom);
          const x = pos.x - origin.x,
            y = pos.y - origin.y;
          if (x < 0 || x > width || y < 0 || y > height) return null;
          const active = s.id === selected;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, harita noktasını seç`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(s)}
              style={{
                position: "absolute",
                left: x - 23,
                top: y - 23,
                width: 46,
                height: 46,
                justifyContent: "center",
                alignItems: "center",
                zIndex: active ? 3 : 2,
              }}
            >
              <View
                style={{
                  width: active ? 43 : 36,
                  height: active ? 43 : 36,
                  backgroundColor: active ? "#B84123" : "#243D34",
                  borderRadius: 22,
                  borderWidth: 3,
                  borderColor: "#FFFEFA",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name={categories.find((c) => c.id === s.category)!.icon}
                  size={active ? 21 : 17}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          );
        })}
      <View style={{ position: "absolute", top: 12, left: 12 }}>
        <Badge
          text={
            items.some((item) => item.coordinatesApproximate)
              ? "Bazı konumlar yaklaşık"
              : "Hizmet noktaları"
          }
          warm
        />
      </View>
      <View
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          backgroundColor: colors.panel,
          borderRadius: 8,
        }}
      >
        <IconButton
          label="Haritayı yakınlaştır"
          icon="add"
          onPress={() => {
            const world = TILE * 2 ** zoom;
            const lon = ((origin.x + width / 2) / world) * 360 - 180;
            const lat =
              (Math.atan(
                Math.sinh(
                  Math.PI * (1 - (2 * (origin.y + height / 2)) / world),
                ),
              ) *
                180) /
              Math.PI;
            setViewportCenter({ latitude: lat, longitude: lon });
            setZoom((z) => Math.min(16, z + 1));
            setShift({ x: 0, y: 0 });
          }}
        />
        <IconButton
          label="Haritayı uzaklaştır"
          icon="remove"
          onPress={() => {
            const world = TILE * 2 ** zoom;
            const lon = ((origin.x + width / 2) / world) * 360 - 180;
            const lat =
              (Math.atan(
                Math.sinh(
                  Math.PI * (1 - (2 * (origin.y + height / 2)) / world),
                ),
              ) *
                180) /
              Math.PI;
            setViewportCenter({ latitude: lat, longitude: lon });
            setZoom((z) => Math.max(10, z - 1));
            setShift({ x: 0, y: 0 });
          }}
        />
        <IconButton
          label="Haritayı merkezle"
          icon="locate-outline"
          onPress={() => {
            setViewportCenter(center);
            setShift({ x: 0, y: 0 });
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 36,
          left: 12,
          backgroundColor: colors.panel,
          borderRadius: 8,
          flexDirection: "row",
        }}
      >
        <IconButton
          label="Haritada batıya git"
          icon="chevron-back"
          onPress={() => setShift((s) => ({ ...s, x: s.x - 150 }))}
        />
        <IconButton
          label="Haritada kuzeye git"
          icon="chevron-up"
          onPress={() => setShift((s) => ({ ...s, y: s.y - 150 }))}
        />
        <IconButton
          label="Haritada güneye git"
          icon="chevron-down"
          onPress={() => setShift((s) => ({ ...s, y: s.y + 150 }))}
        />
        <IconButton
          label="Haritada doğuya git"
          icon="chevron-forward"
          onPress={() => setShift((s) => ({ ...s, x: s.x + 150 }))}
        />
      </View>
      {allTilesFailed && (
        <View
          style={{
            position: "absolute",
            bottom: 92,
            left: 12,
            right: 60,
            padding: 12,
            backgroundColor: colors.panel,
          }}
        >
          <Txt size={12}>
            Harita görselleri yüklenemedi. Hizmet listesi çevrimdışı
            kullanılabilir.
          </Txt>
        </View>
      )}
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void openLink("https://www.openstreetmap.org/copyright", setNotice);
        }}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          backgroundColor: "#FFFEFA",
          minHeight: 28,
          paddingHorizontal: 8,
          justifyContent: "center",
        }}
      >
        <Txt size={10} style={{ color: "#182B2A" }}>
          © OpenStreetMap contributors
        </Txt>
      </Pressable>
    </View>
  );
}
