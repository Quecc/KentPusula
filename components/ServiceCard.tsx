import React from "react";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { CityService, Profile } from "../types";
import { useApp } from "../hooks/useApp";
import { useTheme } from "../theme";
import { Badge, Button, Icon, IconButton, Txt } from "./ui";
import { categories } from "../data/catalog";
import { openingStatus } from "../utils/time";
import { matchService } from "../services/matching";

export function ServiceCard({
  service,
  onPress,
  compact = false,
  profile: override,
}: {
  service: CityService;
  onPress: () => void;
  compact?: boolean;
  profile?: Profile;
}) {
  const { colors } = useTheme();
  const { saved, toggleSaved, profile, now } = useApp();
  const match = matchService(service, override ?? profile, now);
  const cat = categories.find((c) => c.id === service.category)!;
  const isSaved = saved.some((s) => s.id === service.id);
  const freshness =
    service.sourceStatus === "historical"
      ? "Güncellik teyidi gerekli"
      : undefined;
  if (compact)
    return (
      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.panel,
          padding: 16,
          gap: 7,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${service.name}, ayrıntıları aç`}
            onPress={onPress}
            style={{ flex: 1, gap: 5 }}
          >
            <Txt size={12} muted>
              {cat.name} · {service.district}
            </Txt>
            <Txt size={18} weight="700">
              {service.name}
            </Txt>
          </Pressable>
          <IconButton
            label={
              isSaved
                ? `${service.name} kaydını kaldır`
                : `${service.name} kaydet`
            }
            icon={isSaved ? "bookmark" : "bookmark-outline"}
            active={isSaved}
            onPress={() => toggleSaved(service.id)}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {service.isFree === true && <Badge text="Ücretsiz" />}
          <Txt size={12} muted style={{ alignSelf: "center" }}>
            {freshness ?? openingStatus(service, now).label}
          </Txt>
        </View>
      </View>
    );
  return (
    <View
      style={{
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 21,
          paddingTop: 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon name={cat.icon} size={18} color={colors.accent} />
          <Txt size={11} weight="700" muted>
            {cat.name.toLocaleUpperCase("tr-TR")} / {service.district}
          </Txt>
        </View>
        <IconButton
          label={
            isSaved
              ? `${service.name} kaydını kaldır`
              : `${service.name} kaydet`
          }
          icon={isSaved ? "bookmark" : "bookmark-outline"}
          active={isSaved}
          onPress={() => toggleSaved(service.id)}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${service.name}, ayrıntıları aç`}
        onPress={onPress}
        style={({ pressed }) => ({
          paddingHorizontal: 21,
          paddingBottom: 22,
          gap: 12,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Txt size={compact ? 19 : 23} weight="700">
          {service.name}
        </Txt>
        <Txt size={12} muted>
          {service.provider}
        </Txt>
        {!compact && (
          <Txt size={14} muted numberOfLines={2}>
            {service.description}
          </Txt>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          <Badge
            text={
              service.isFree === true
                ? "Ücretsiz"
                : "Ücret bilgisi teyit edilmeli"
            }
          />
          <Badge warm text={openingStatus(service, now).label} />
        </View>
        {freshness && (
          <Txt size={12} style={{ color: colors.accent }}>
            {freshness}
          </Txt>
        )}
        <View
          style={{
            paddingTop: 11,
            borderTopWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Txt size={12} weight="600" muted>
            {match.distance !== null
              ? `Yaklaşık ${match.distance.toFixed(1)} km`
              : service.applicationRequired
                ? "Kayıt gerekli"
                : service.applicationRequired === false
                  ? "Başvurusuz"
                  : "Koşulları ayrıntıda gör"}
          </Txt>
          <Icon name="arrow-forward" size={18} />
        </View>
      </Pressable>
      <View style={{ padding: 18, paddingTop: 0 }}>
        <Button
          label="Nasıl giderim?"
          icon="bus-outline"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/transport/[id]",
              params: { id: service.id },
            })
          }
        />
      </View>
    </View>
  );
}
