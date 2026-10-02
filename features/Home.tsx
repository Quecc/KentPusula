import React, { useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "../theme";
import { useApp } from "../hooks/useApp";
import { Button, Chip, Icon, SectionHeading, Txt } from "../components/ui";
import { NeedInput } from "../components/NeedInput";
import { ServiceCard } from "../components/ServiceCard";
import { categories, services } from "../data/catalog";
import { findMatches } from "../services/matching";
import { Category, CityService } from "../types";

export function Home({
  onQuery,
  onCategory,
  onDetail,
  onMap,
  busy,
}: {
  onQuery: (text: string) => void;
  onCategory: (c?: Category) => void;
  onDetail: (s: CityService) => void;
  onMap: () => void;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const { profile, now } = useApp();
  const wide = useWindowDimensions().width >= 1000;
  const [writing, setWriting] = useState(false);
  const matches = findMatches(services, profile, now);
  const featured = (["food", "study", "career"] as Category[])
    .map(
      (category) =>
        matches.find((match) => match.service.category === category)?.service,
    )
    .filter((service): service is CityService => !!service)
    .slice(0, wide ? 3 : 2);
  const actions = [
    {
      label: "Yemek bul",
      icon: "restaurant-outline",
      action: () => onCategory("food"),
    },
    {
      label: "Çalışma yeri bul",
      icon: "book-outline",
      action: () => onCategory("study"),
    },
    { label: "Yakın yerler", icon: "location-outline", action: onMap },
  ];
  return (
    <View style={{ gap: 25 }}>
      <View style={{ gap: 6 }}>
        <Txt
          accessibilityRole="header"
          size={wide ? 42 : 32}
          weight="700"
          style={{ letterSpacing: -1 }}
        >
          Bugün ne arıyorsun?
        </Txt>
        <Txt size={15} muted>
          Ankara’da sana uygun bir yer.
        </Txt>
      </View>
      <View style={{ flexDirection: "row", gap: 9 }}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.action}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 96,
              borderRadius: 18,
              padding: 12,
              gap: 10,
              justifyContent: "center",
              backgroundColor: colors.panel,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Icon name={action.icon} size={25} color={colors.green} />
            <Txt size={13} weight="600">
              {action.label}
            </Txt>
          </Pressable>
        ))}
      </View>
      <View>
        <SectionHeading
          title="Senin için"
          action="Tümü"
          onPress={() => onCategory()}
        />
        <View style={{ flexDirection: wide ? "row" : "column", gap: 10 }}>
          {featured.map((service) => (
            <View key={service.id} style={{ flex: 1 }}>
              <ServiceCard
                service={service}
                onPress={() => onDetail(service)}
                compact
              />
            </View>
          ))}
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 20 }}
      >
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            onPress={() => onCategory(category.id)}
          />
        ))}
      </ScrollView>
      <View style={{ gap: 12 }}>
        <Button
          label={writing ? "İstek alanını kapat" : "İhtiyacını yazarak planla"}
          variant="secondary"
          icon={writing ? "chevron-up" : "create-outline"}
          onPress={() => setWriting((value) => !value)}
        />
        {writing && <NeedInput onSubmit={onQuery} busy={busy} />}
      </View>
      <Txt size={12} muted style={{ textAlign: "center" }}>
        Resmî kaynaklara dayalı kent rehberi.
      </Txt>
    </View>
  );
}
