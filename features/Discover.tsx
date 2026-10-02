import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Category, CityService } from "../types";
import { categories, services } from "../data/catalog";
import { useTheme } from "../theme";
import { useApp } from "../hooks/useApp";
import { Button, Chip, Empty, Icon, Txt } from "../components/ui";
import { ServiceCard } from "../components/ServiceCard";
import { findMatches } from "../services/matching";
import { openingStatus } from "../utils/time";

const collections = [
  "Tüm hizmetler",
  "Programa göre açık",
  "Öğrencilere özel",
  "Yakınımda",
  "Başvurusuz",
] as const;
const PAGE_SIZE = 8;
export function Discover({
  category,
  onCategory,
  onDetail,
}: {
  category?: Category;
  onCategory: (c?: Category) => void;
  onDetail: (s: CityService) => void;
}) {
  const { colors, scale } = useTheme();
  const { profile, now } = useApp();
  const [query, setQuery] = useState(""),
    [collection, setCollection] = useState<string>("Tüm hizmetler");
  const [radius, setRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const filterKey = JSON.stringify([
    category,
    query,
    collection,
    radius,
    profile,
  ]);
  const [pagination, setPagination] = useState({ key: "", page: 0 });
  const page = pagination.key === filterKey ? pagination.page : 0;
  const setPage = (update: (p: number) => number) =>
    setPagination({ key: filterKey, page: update(page) });
  const cols = useWindowDimensions().width >= 1000 ? 2 : 1;
  const matches = useMemo(
    () =>
      findMatches(
        services,
        profile,
        now,
        category ? [category] : [],
        query,
      ).filter((m) => {
        if (collection === "Programa göre açık")
          return openingStatus(m.service, now).open === true;
        if (collection === "Öğrencilere özel") return m.service.studentRequired;
        if (collection === "Yakınımda")
          return m.distance !== null && m.distance <= radius;
        if (collection === "Başvurusuz")
          return m.service.applicationRequired === false;
        return true;
      }),
    [category, query, collection, radius, profile, now],
  );
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Txt accessibilityRole="header" size={32} weight="700">
          Keşfet
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtreler"
          accessibilityState={{ expanded: showFilters }}
          onPress={() => setShowFilters((value) => !value)}
          style={{
            minHeight: 46,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 9,
          }}
        >
          <Icon name="options-outline" size={19} />
          <Txt size={14} weight="600">
            Filtreler{collection !== "Tüm hizmetler" ? " · 1" : ""}
          </Txt>
          <Icon name={showFilters ? "chevron-up" : "chevron-down"} size={16} />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingHorizontal: 15,
          gap: 10,
        }}
      >
        <Icon name="search-outline" />
        <TextInput
          accessibilityLabel="Hizmet, ilçe veya anahtar kelime ara"
          value={query}
          onChangeText={setQuery}
          placeholder="Hizmet veya ilçe ara"
          placeholderTextColor={colors.muted}
          style={{
            flex: 1,
            minHeight: 54,
            color: colors.ink,
            fontSize: 15 * scale,
          }}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 20 }}
      >
        <Chip label="Hepsi" selected={!category} onPress={() => onCategory()} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={category === c.id}
            onPress={() => onCategory(category === c.id ? undefined : c.id)}
          />
        ))}
      </ScrollView>
      {showFilters && (
        <View
          style={{
            gap: 11,
            backgroundColor: colors.panel,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          >
            {collections.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={collection === c}
                onPress={() => setCollection(c)}
              />
            ))}
          </ScrollView>
          {collection === "Yakınımda" && (
            <View style={{ gap: 8 }}>
              <Txt size={13} muted>
                Arama çevresi
              </Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[5, 10, 30].map((distance) => (
                  <Chip
                    key={distance}
                    label={`${distance} km`}
                    selected={radius === distance}
                    onPress={() => setRadius(distance)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      <Txt size={13} muted>
        {matches.length} sonuç
        {collection === "Yakınımda"
          ? ` · ${radius} km çevrende`
          : collection !== "Tüm hizmetler"
            ? ` · ${collection}`
            : ""}
      </Txt>
      <FlatList
        key={cols}
        data={matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
        numColumns={cols}
        scrollEnabled={false}
        keyExtractor={(m) => m.service.id}
        columnWrapperStyle={cols > 1 ? { gap: 14 } : undefined}
        contentContainerStyle={{ gap: 14 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: cols === 2 ? "49.3%" : "100%" }}>
            <ServiceCard
              service={item.service}
              onPress={() => onDetail(item.service)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Empty
            title="Bu seçimde bir sonuç yok."
            description={
              collection === "Yakınımda" && !profile.location
                ? "Yakındaki hizmetleri sıralamak için Ayarlar’dan konumunu paylaşabilirsin. Tüm hizmetleri konumsuz da keşfedebilirsin."
                : "Filtreleri kaldırabilir veya yakınlık aramanı genişletebilirsin."
            }
            action={
              collection === "Yakınımda" && radius < 30 && !!profile.location
                ? "Arama alanını 30 km’ye genişlet"
                : "Tüm hizmetlere dön"
            }
            onPress={() => {
              if (collection === "Yakınımda" && radius < 30 && profile.location)
                setRadius(30);
              else {
                setQuery("");
                onCategory();
                setCollection("Tüm hizmetler");
              }
            }}
          />
        }
      />
      {matches.length > PAGE_SIZE && (
        <View style={{ gap: 10 }}>
          <Txt size={12} muted>
            Sayfa {page + 1} / {Math.ceil(matches.length / PAGE_SIZE)}
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              label="Önceki sayfa"
              disabled={page === 0}
              variant="secondary"
              onPress={() => setPage((p) => p - 1)}
            />
            <Button
              label="Sonraki sayfa"
              disabled={(page + 1) * PAGE_SIZE >= matches.length}
              variant="secondary"
              onPress={() => setPage((p) => p + 1)}
            />
          </View>
        </View>
      )}
    </View>
  );
}
