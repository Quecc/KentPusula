import React, { useState } from "react";
import { View } from "react-native";
import * as Speech from "expo-speech";
import { useApp } from "../hooks/useApp";
import { useTheme } from "../theme";
import { CityService } from "../types";
import { Badge, Button, Empty, Icon, Txt } from "../components/ui";
import { NeedInput } from "../components/NeedInput";
import { clock } from "../utils/time";

export function Compass({
  onQuery,
  onDetail,
  onMap,
  busy,
}: {
  onQuery: (text: string) => void;
  onDetail: (s: CityService) => void;
  onMap: (s: CityService) => void;
  busy: boolean;
}) {
  const { plan, setNotice } = useApp();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <View style={{ gap: 25 }}>
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <View
          style={{
            width: 56,
            height: 56,
            backgroundColor: colors.accentSoft,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="compass-outline" size={34} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={11} weight="700" muted>
            İHTİYACINDAN ROTANA
          </Txt>
          <Txt accessibilityRole="header" size={35} weight="700">
            Pusula
          </Txt>
        </View>
      </View>
      {!plan && (
        <Txt muted>
          Üç saat boşluğun mu var, sessiz bir masa mı arıyorsun? İhtiyacını yaz;
          sana bir şehir planı çıkaralım.
        </Txt>
      )}
      <NeedInput onSubmit={onQuery} busy={busy} />
      {plan && (
        <>
          <View style={{ gap: 12 }}>
            <Badge
              text={
                plan.demo
                  ? "SUNUM PLANI · ÖRNEK SAATLER"
                  : "KAYNAKLARA DAYALI PLAN"
              }
              warm={plan.demo}
            />
            <Txt size={30} weight="700">
              {plan.stops.length
                ? "Sana uygun bir plan hazırladım."
                : "Biraz daha yön bulalım."}
            </Txt>
            <Txt size={14} muted>
              “{plan.intent.text}”
            </Txt>
            {plan.stops.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Badge text={`${plan.stops.length} durak`} />
                <Badge text={`${plan.intent.durationMinutes} dk zamanın var`} />
                <Badge
                  text={
                    plan.stops.every(
                      (stop) => stop.match.service.isFree === true,
                    )
                      ? "Hizmetler ücretsiz"
                      : "Ücret koşullarını kontrol et"
                  }
                />
              </View>
            )}
          </View>
          {plan.stops.map((stop, index) => {
            const s = stop.match.service;
            const open = expanded.includes(s.id);
            return (
              <View key={s.id} style={{ flexDirection: "row", gap: 14 }}>
                <View style={{ width: 53, alignItems: "center" }}>
                  <Txt weight="700" size={15}>
                    {clock(stop.startMinute)}
                  </Txt>
                  <View
                    style={{
                      marginTop: 14,
                      width: 31,
                      height: 31,
                      borderWidth: 2,
                      borderColor: colors.accent,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.bg,
                    }}
                  >
                    <Txt size={12} weight="700">
                      {index + 1}
                    </Txt>
                  </View>
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: colors.line,
                      marginTop: 6,
                    }}
                  />
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: colors.panel,
                      borderRadius: 10,
                      padding: 20,
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Txt
                        size={11}
                        weight="700"
                        style={{ color: colors.accent }}
                      >
                        {s.category === "food"
                          ? "ÖNCE GÜZEL BİR YEMEK"
                          : s.category === "study"
                            ? "SONRA KENDİNE BİR MASA"
                            : "SIRADAKİ DURAĞIN"}
                      </Txt>
                      <Icon
                        name={
                          s.category === "food"
                            ? "restaurant-outline"
                            : "book-outline"
                        }
                        color={colors.accent}
                      />
                    </View>
                    <Txt size={24} weight="700">
                      {s.name}
                    </Txt>
                    <Txt size={12} muted>
                      {s.provider}
                    </Txt>
                    <Txt size={14} muted numberOfLines={2}>
                      {s.description}
                    </Txt>
                    <Txt size={12} muted>
                      {clock(stop.startMinute)}–
                      {clock(stop.startMinute + stop.durationMinutes)} ·{" "}
                      {stop.durationMinutes} dk
                      {stop.provisional ? " · Örnek zamanlama" : ""}
                    </Txt>
                    <Button
                      label={
                        open
                          ? "Uygunluk açıklamasını kapat"
                          : "Neden bana uygun?"
                      }
                      icon={open ? "chevron-up" : "chevron-down"}
                      variant="secondary"
                      onPress={() =>
                        setExpanded((prev) =>
                          open
                            ? prev.filter((id) => id !== s.id)
                            : [...prev, s.id],
                        )
                      }
                    />
                    {open && (
                      <View style={{ gap: 9 }}>
                        {stop.match.reasons.map((reason) => (
                          <View
                            key={reason}
                            style={{ flexDirection: "row", gap: 8 }}
                          >
                            <Icon
                              name="checkmark-circle-outline"
                              color={colors.green}
                              size={18}
                            />
                            <Txt size={13} style={{ flex: 1 }}>
                              {reason}
                            </Txt>
                          </View>
                        ))}
                        {stop.match.cautions.map((c) => (
                          <View
                            key={c}
                            style={{ flexDirection: "row", gap: 8 }}
                          >
                            <Icon
                              name="information-circle-outline"
                              color={colors.accent}
                              size={18}
                            />
                            <Txt size={12} muted style={{ flex: 1 }}>
                              {c}
                            </Txt>
                          </View>
                        ))}
                      </View>
                    )}
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      <Button
                        label="Hizmeti incele"
                        onPress={() => onDetail(s)}
                        icon="arrow-forward"
                      />
                      <Button
                        label="Buraya git"
                        onPress={() => onMap(s)}
                        variant="secondary"
                        icon="navigate-outline"
                      />
                    </View>
                  </View>
                  <Txt size={12} muted style={{ marginBottom: 12 }}>
                    Yaklaşık {stop.travelMinutes} dk yürüyüş
                  </Txt>
                </View>
              </View>
            );
          })}
          {!plan.stops.length && (
            <Empty
              title="Bu süreye bir durak yerleştiremedim."
              description="Daha uzun süre belirtebilir veya yarın için bir ihtiyaç yazabilirsin. Örneğin: Yarın 3 saatim var, yemek arıyorum."
              action="Yarın için yeniden dene"
              onPress={() =>
                onQuery(
                  `${plan.intent.text.replace(/bugün|yarın/gi, "")} yarın`,
                )
              }
            />
          )}
          <View
            style={{
              gap: 10,
              padding: 18,
              borderRadius: 8,
              backgroundColor: colors.accentSoft,
            }}
          >
            {plan.warnings.map((w, i) => (
              <Txt key={i} size={12}>
                {w}
              </Txt>
            ))}
          </View>
          {plan.stops.length > 0 && (
            <Button
              label="Planı sesli oku"
              variant="secondary"
              icon="volume-high-outline"
              onPress={() => {
                Speech.stop();
                Speech.speak(
                  plan.stops
                    .map(
                      (s) =>
                        `${clock(s.startMinute)}. ${s.match.service.name}.`,
                    )
                    .join(" ") +
                    (plan.demo
                      ? "Bu bir sunum planıdır. Saatleri kurumdan teyit edin."
                      : ""),
                  {
                    language: "tr-TR",
                    onError: () =>
                      setNotice("Sesli okuma bu cihazda başlatılamadı."),
                  },
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
