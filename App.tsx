import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./hooks/useApp";
import { useTheme } from "./theme";
import { Category, CityService, Tab } from "./types";
import { DEFAULT_LOCATION, services, categories } from "./data/catalog";
import { CompassMark } from "./components/CityIllustration";
import { Badge, Icon, IconButton, Txt } from "./components/ui";
import { Onboarding } from "./features/Onboarding";
import { Home } from "./features/Home";
import { Discover } from "./features/Discover";
import { Compass } from "./features/Compass";
import { MapScreen } from "./features/MapScreen";
import { Saved } from "./features/Saved";
import { localIntentProvider, localRepository } from "./services/providers";
import { createPlan } from "./services/planner";

const nav: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Ana Sayfa", icon: "grid-outline" },
  { id: "discover", label: "Keşfet", icon: "search-outline" },
  { id: "compass", label: "Pusula", icon: "compass-outline" },
  { id: "map", label: "Harita", icon: "map-outline" },
  { id: "saved", label: "Kaydedilenler", icon: "bookmark-outline" },
];
export default function AppContent() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const {
    ready,
    onboarded,
    preferences,
    setPreferences,
    profile,
    setPlan,
    now,
    setNotice,
    saved,
  } = useApp();
  const params = useLocalSearchParams<{
    tab: string;
    category?: string;
    target?: string;
  }>();
  const tab: Tab = nav.some((n) => n.id === params.tab)
    ? (params.tab as Tab)
    : "home";
  const category = categories.some((c) => c.id === params.category)
    ? (params.category as Category)
    : undefined;
  const target = services.find((s) => s.id === params.target);
  const [busy, setBusy] = useState(false);
  const setTab = (value: Tab) =>
    router.replace({ pathname: "/[tab]", params: { tab: value } });
  const setCategory = (value?: Category) =>
    router.setParams({ category: value ?? "" });
  const setDetail = (service: CityService) =>
    router.push({ pathname: "/service/[id]", params: { id: service.id } });
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);
  async function handleQuery(text: string) {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      const intent = await localIntentProvider.analyze(text);
      const catalog = await localRepository.list();
      setPlan(
        createPlan(
          catalog,
          intent,
          {
            ...profile,
            location:
              profile.location ??
              (preferences.demo ? DEFAULT_LOCATION : undefined),
          },
          now,
          preferences.demo,
        ),
      );
      setTab("compass");
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch {
      setNotice(
        "Plan hazırlanamadı. İhtiyacını yeniden yazabilir veya Keşfet’i kullanabilirsin.",
      );
    } finally {
      setBusy(false);
    }
  }
  function showMap(s?: CityService) {
    router.replace({
      pathname: "/[tab]",
      params: { tab: "map", target: s?.id ?? "" },
    });
  }
  function discover(c?: Category) {
    router.replace({
      pathname: "/[tab]",
      params: { tab: "discover", category: c ?? "" },
    });
  }
  function navItem(item: (typeof nav)[number]) {
    const active = tab === item.id;
    return (
      <Pressable
        key={item.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={item.label}
        onPress={() => setTab(item.id)}
        style={({ pressed }) => ({
          flex: desktop ? undefined : 1,
          flexDirection: desktop ? "row" : "column",
          minHeight: desktop ? 52 : 62,
          alignItems: "center",
          justifyContent: desktop ? "flex-start" : "center",
          gap: desktop ? 13 : 4,
          paddingHorizontal: desktop ? 16 : 2,
          borderRadius: 7,
          backgroundColor: active
            ? item.id === "compass"
              ? colors.accentSoft
              : colors.greenSoft
            : "transparent",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Icon
          name={item.icon}
          color={
            active
              ? item.id === "compass"
                ? colors.accent
                : colors.green
              : colors.muted
          }
          size={item.id === "compass" ? 27 : 21}
        />
        <Txt
          size={desktop ? 14 : 10}
          weight={active ? "700" : "500"}
          style={{ color: active ? colors.ink : colors.muted }}
        >
          {item.label}
        </Txt>
        {desktop && item.id === "saved" && saved.length > 0 && (
          <Txt size={11} muted>
            {saved.length}
          </Txt>
        )}
      </Pressable>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {!ready ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
          }}
        >
          <CompassMark size={60} />
          <ActivityIndicator color={colors.accent} />
          <Txt>Kent rehberin açılıyor…</Txt>
        </View>
      ) : !onboarded ? (
        <Onboarding />
      ) : (
        <View style={{ flex: 1, flexDirection: "row" }}>
          {desktop && (
            <View
              style={{
                width: 222,
                borderRightWidth: 1,
                borderColor: colors.line,
                padding: 24,
                paddingHorizontal: 18,
                gap: 30,
                backgroundColor: colors.panel,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "center",
                  paddingHorizontal: 7,
                }}
              >
                <CompassMark size={31} />
                <Txt size={22} weight="800" style={{ letterSpacing: -0.8 }}>
                  KentPusula
                </Txt>
              </View>
              <View style={{ gap: 7 }}>{nav.map(navItem)}</View>
              <View style={{ flex: 1 }} />
              <View
                style={{
                  gap: 11,
                  padding: 13,
                  borderTopWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Txt size={10} weight="700" muted style={{ letterSpacing: 1 }}>
                  ŞEHİR SENİNLE.
                </Txt>
                <Txt size={12} muted>
                  Ankara’nın ücretsiz{"\n"}imkânlarına açılan yol.
                </Txt>
                <Badge text="ANKARA / 06" />
              </View>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View
              style={{
                minHeight: desktop ? 82 : 64,
                paddingHorizontal: desktop ? 38 : 20,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: colors.line,
                gap: 12,
              }}
            >
              {!desktop && <CompassMark size={29} />}
              <Icon name="location-outline" size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="600">
                  {profile.location ? "Konumun çevresinde" : "Ankara"}
                </Txt>
                {desktop && (
                  <Txt size={10} muted>
                    {profile.location
                      ? "Konum bu oturumda kullanılıyor"
                      : "Başlangıç bölgesi · konum paylaşılmadı"}
                  </Txt>
                )}
              </View>
              {desktop && (
                <Txt size={12} muted>
                  {preferences.demo
                    ? "01 EKİM PERŞEMBE / SUNUM"
                    : now.toLocaleDateString("tr-TR", {
                        timeZone: "Europe/Istanbul",
                        day: "numeric",
                        month: "long",
                      })}
                </Txt>
              )}
              <IconButton
                label="Ayarları aç"
                icon="options-outline"
                onPress={() => router.push("/settings")}
              />
            </View>
            {preferences.demo && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sunum saati açık. Gerçek saate dön"
                onPress={() => {
                  setPreferences({ ...preferences, demo: false });
                  setPlan(null);
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: colors.accentSoft,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Txt size={12} weight="600">
                  Sunum · 1 Ekim, 17.00
                </Txt>
                <Txt size={12} weight="700">
                  Gerçek saate dön
                </Txt>
              </Pressable>
            )}
            <ScrollView
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: desktop ? 36 : 20,
                paddingTop: desktop ? 32 : 25,
                paddingBottom: 35,
                width: "100%",
                maxWidth: 1240,
                alignSelf: "center",
              }}
            >
              {tab === "home" && (
                <Home
                  onQuery={handleQuery}
                  onCategory={discover}
                  onDetail={setDetail}
                  onMap={() => showMap()}
                  busy={busy}
                />
              )}
              {tab === "discover" && (
                <Discover
                  category={category}
                  onCategory={setCategory}
                  onDetail={setDetail}
                />
              )}
              {tab === "compass" && (
                <Compass
                  onQuery={handleQuery}
                  onDetail={setDetail}
                  onMap={showMap}
                  busy={busy}
                />
              )}
              {tab === "map" && (
                <MapScreen
                  key={target?.id ?? "overview"}
                  target={target}
                  onDetail={setDetail}
                />
              )}
              {tab === "saved" && (
                <Saved onDetail={setDetail} onDiscover={() => discover()} />
              )}
            </ScrollView>
            {!desktop && (
              <View
                accessibilityRole="tablist"
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 7,
                  borderTopWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.panel,
                }}
              >
                {nav.map(navItem)}
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
