import React, { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { useApp } from "../hooks/useApp";
import { useTheme } from "../theme";
import { Badge, Button, Chip, Txt } from "../components/ui";
import { CityIllustration, CompassMark } from "../components/CityIllustration";
import { categories } from "../data/catalog";

export function Onboarding() {
  const { colors, scale } = useTheme();
  const { profile, setProfile, finishOnboarding, setNotice } = useApp();
  const [age, setAge] = useState("");
  const [locating, setLocating] = useState(false);
  const validAge = !age || (/^\d{1,3}$/.test(age) && +age > 0 && +age <= 120);
  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice(
          "Konum izni verilmedi. Konumsuz keşfetmeye devam edebilirsin.",
        );
        return;
      }
      const point = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setProfile({
        ...profile,
        location: {
          latitude: point.coords.latitude,
          longitude: point.coords.longitude,
        },
      });
    } catch {
      setNotice(
        "Konum alınamadı. Daha sonra Ayarlar’dan yeniden deneyebilirsin.",
      );
    } finally {
      setLocating(false);
    }
  }
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 50,
        flexGrow: 1,
        alignItems: "center",
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: "100%", maxWidth: 560, gap: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CompassMark />
          <Txt size={24} weight="800">
            KentPusula
          </Txt>
          <View style={{ flex: 1 }} />
          <Badge text="ANKARA / 06" />
        </View>
        <View
          style={{
            backgroundColor: colors.hero,
            padding: 24,
            borderRadius: 12,
          }}
        >
          <Txt size={32} weight="700" style={{ color: colors.heroText }}>
            Şehirde bir yerin var.
          </Txt>
          <CityIllustration height={180} />
        </View>
        <View style={{ gap: 10 }}>
          <Txt size={28} weight="700">
            Ankara’da sana uygun yerleri bul.
          </Txt>
          <Txt muted>İhtiyacını söyle, şehir yol göstersin.</Txt>
        </View>
        <Txt size={12} weight="700" muted>
          SENİ BİRAZ TANIYALIM · TAMAMI İSTEĞE BAĞLI
        </Txt>
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <View style={{ gap: 7 }}>
            <Txt size={13}>Yaşın</Txt>
            <TextInput
              accessibilityLabel="Yaşın, isteğe bağlı"
              placeholder="—"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              maxLength={3}
              style={{
                width: 85,
                minHeight: 48,
                padding: 12,
                borderWidth: 1,
                borderColor: validAge ? colors.line : colors.accent,
                borderRadius: 6,
                color: colors.ink,
                fontSize: 17 * scale,
              }}
            />
          </View>
          <View style={{ gap: 7, flex: 1 }}>
            <Txt size={13}>Öğrenci misin?</Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip
                label="Evet"
                selected={profile.student === true}
                onPress={() =>
                  setProfile({
                    ...profile,
                    student: profile.student === true ? undefined : true,
                  })
                }
              />
              <Chip
                label="Hayır"
                selected={profile.student === false}
                onPress={() =>
                  setProfile({
                    ...profile,
                    student: profile.student === false ? undefined : false,
                  })
                }
              />
            </View>
          </View>
        </View>
        {!validAge && (
          <Txt style={{ color: colors.accent }} size={12}>
            1–120 arasında bir yaş gir veya boş bırak.
          </Txt>
        )}
        <View style={{ gap: 9 }}>
          <Txt size={13}>İlgini çekenler</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={profile.interests.includes(c.id)}
                onPress={() =>
                  setProfile({
                    ...profile,
                    interests: profile.interests.includes(c.id)
                      ? profile.interests.filter((v) => v !== c.id)
                      : [...profile.interests, c.id],
                  })
                }
              />
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Button
            label={
              locating
                ? "Konum alınıyor…"
                : profile.location
                  ? "Konum alındı"
                  : "Yakınımdakiler için konum kullan"
            }
            icon="locate-outline"
            variant="secondary"
            disabled={locating}
            onPress={locate}
          />
          <Txt size={12} muted>
            Konum yalnızca yakındaki yerleri göstermek için kullanılır.
          </Txt>
        </View>
        <Button
          label="Şehri keşfet"
          icon="arrow-forward"
          disabled={!validAge}
          onPress={() => {
            setProfile({ ...profile, age: age ? +age : undefined });
            finishOnboarding();
          }}
        />
        <Button
          label="Şimdilik geç"
          variant="ghost"
          onPress={finishOnboarding}
        />
      </View>
    </ScrollView>
  );
}
