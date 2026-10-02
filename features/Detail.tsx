import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { CityService } from "../types";
import { useTheme } from "../theme";
import { useApp } from "../hooks/useApp";
import { Badge, Button, Icon, IconButton, Txt } from "../components/ui";
import { categories } from "../data/catalog";
import { matchService } from "../services/matching";
import { openingStatus } from "../utils/time";
import { openLink } from "../utils/links";

export function Detail({
  service: s,
  onClose,
  onMap,
}: {
  service: CityService;
  onClose: () => void;
  onMap: () => void;
}) {
  const { colors } = useTheme();
  const { saved, toggleSaved, profile, plan, now, setNotice, preferences } =
    useApp();
  const effective = plan
    ? {
        ...profile,
        age: plan.intent.age ?? profile.age,
        student: plan.intent.student ?? profile.student,
      }
    : profile;
  const match = matchService(s, effective, now);
  const isSaved = saved.some((v) => v.id === s.id);
  const [showDetails, setShowDetails] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const details = [
    ["Kurum", s.provider],
    ["Adres", s.address],
    ["Bugünkü durum", openingStatus(s, now).label],
    [
      "Yayımlanan saatler",
      s.openingHours
        ?.map(
          (h) =>
            `${h.days.length === 5 ? "Hafta içi" : "Belirtilen günler"} ${h.open}–${h.close}`,
        )
        .join(", ") ?? "Teyit edilmedi",
    ],
    ["Kimler yararlanabilir?", s.eligibility],
    [
      "Yaş koşulu",
      s.ageMin !== null || s.ageMax !== null
        ? `${s.ageMin ?? "Alt sınır yok"} – ${s.ageMax ?? "Üst sınır yok"}`
        : "Kaynakta yaş sınırı belirtilmemiş",
    ],
    [
      "Öğrenci şartı",
      s.studentRequired
        ? "Üniversite öğrencisi olmak gerekiyor"
        : "Kaynakta öğrenci şartı belirtilmemiş",
    ],
    ["Gerekli belgeler", s.documents.join("\n")],
    [
      "Başvuru",
      s.applicationRequired === true
        ? "Kayıt / başvuru gerekli"
        : s.applicationRequired === false
          ? "Gerekmiyor"
          : "Kurumdan teyit edilmeli",
    ],
    [
      "Ücret",
      s.isFree ? "Kaynakta ücretsiz belirtilmiş" : "Kurumdan teyit edilmeli",
    ],
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderColor: colors.line,
        }}
      >
        <IconButton label="Detayı kapat" icon="arrow-back" onPress={onClose} />
        <Txt weight="600" style={{ flex: 1 }}>
          Hizmet rehberi
        </Txt>
        <IconButton
          label={isSaved ? "Kaydı kaldır" : "Hizmeti kaydet"}
          icon={isSaved ? "bookmark" : "bookmark-outline"}
          active={isSaved}
          onPress={() => toggleSaved(s.id)}
        />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 24,
          maxWidth: 720,
          width: "100%",
          alignSelf: "center",
          paddingBottom: 50,
        }}
      >
        {preferences.demo && <Badge text="Sunum saati · 1 Ekim, 17.00" warm />}
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Badge text={categories.find((c) => c.id === s.category)!.name} />
            <Badge
              text={s.isFree === true ? "Ücretsiz" : "Ücret teyidi gerekli"}
            />
          </View>
          <Txt accessibilityRole="header" size={34} weight="700">
            {s.name}
          </Txt>
          <Txt muted>{s.description}</Txt>
        </View>
        <Button
          label="Nasıl giderim?"
          icon="bus-outline"
          onPress={() =>
            router.push({ pathname: "/transport/[id]", params: { id: s.id } })
          }
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            label={s.latitude !== null ? "Haritada göster" : "Haritayı aç"}
            variant="secondary"
            icon="navigate-outline"
            style={{ flex: 1 }}
            onPress={onMap}
          />
          {s.applicationUrl && (
            <Button
              label="Başvuru"
              variant="secondary"
              icon="open-outline"
              style={{ flex: 1 }}
              onPress={() => void openLink(s.applicationUrl!, setNotice)}
            />
          )}
        </View>
        <View
          style={{
            backgroundColor: colors.greenSoft,
            borderRadius: 8,
            padding: 20,
            gap: 12,
          }}
        >
          <Txt weight="700">
            {match.eligible
              ? "Koşullar senin için ne söylüyor?"
              : "Bu hizmetin koşulları sana uymuyor"}
          </Txt>
          {match.reasons.map((r) => (
            <View key={r} style={{ flexDirection: "row", gap: 8 }}>
              <Icon name="checkmark-outline" color={colors.green} size={18} />
              <Txt size={13} style={{ flex: 1 }}>
                {r}
              </Txt>
            </View>
          ))}
          {match.cautions.map((c) => (
            <Txt key={c} size={12} muted>
              • {c}
            </Txt>
          ))}
        </View>
        <View style={{ gap: 10 }}>
          <Txt size={21} weight="700">
            Bilgiler
          </Txt>
          {details
            .slice(0, showDetails ? undefined : 4)
            .map(([label, value]) => (
              <View
                key={label}
                style={{
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderColor: colors.line,
                  gap: 5,
                }}
              >
                <Txt size={11} weight="700" muted>
                  {label.toLocaleUpperCase("tr-TR")}
                </Txt>
                <Txt size={15}>{value}</Txt>
              </View>
            ))}
          <Button
            label={showDetails ? "Daha az göster" : "Tüm bilgileri göster"}
            variant="ghost"
            onPress={() => setShowDetails((value) => !value)}
          />
        </View>
        <View
          style={{
            gap: 12,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 16,
            backgroundColor: colors.panel,
          }}
        >
          <View style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
            <Icon name="shield-checkmark-outline" color={colors.green} />
            <Txt size={20} weight="700">
              Resmî kaynak
            </Txt>
          </View>
          <Txt size={13} muted>
            {s.provider}
          </Txt>
          <Button
            label={
              showSource ? "Kaynak bilgisini gizle" : "Kaynak bilgisini göster"
            }
            variant="ghost"
            onPress={() => setShowSource((value) => !value)}
          />
          {showSource && (
            <>
              <Txt size={12} muted>
                Kaynak okuması: 01.10.2026 · Katalog: {s.lastUpdatedAt}
              </Txt>
              <Txt size={13}>{s.sourceNote}</Txt>
              <Button
                label="Resmî sayfayı aç"
                icon="open-outline"
                variant="secondary"
                onPress={() => void openLink(s.officialSourceUrl, setNotice)}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
