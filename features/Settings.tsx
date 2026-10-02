import React from "react";
import { ScrollView, Switch, View } from "react-native";
import * as Location from "expo-location";
import { useApp } from "../hooks/useApp";
import { useTheme } from "../theme";
import { Button, Chip, IconButton, Txt } from "../components/ui";

export function Settings({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const {
    preferences,
    setPreferences,
    profile,
    setProfile,
    setNotice,
    setPlan,
  } = useApp();
  async function locate() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice("Konum izni verilmedi. Uygulamayı konumsuz kullanabilirsin.");
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
      setNotice("Konum bu oturum için alındı.");
    } catch {
      setNotice("Konum alınamadı. Cihazının konum ayarlarını kontrol et.");
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <IconButton
          label="Ayarları kapat"
          icon="arrow-back"
          onPress={onClose}
        />
        <Txt size={23} weight="700">
          Sana göre KentPusula
        </Txt>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 26,
          maxWidth: 650,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <View style={{ gap: 12 }}>
          <Txt size={18} weight="700">
            Görünüm
          </Txt>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["system", "light", "dark"] as const).map((theme, i) => (
              <Chip
                key={theme}
                label={["Cihaza göre", "Açık", "Koyu"][i]}
                selected={preferences.theme === theme}
                onPress={() => setPreferences({ ...preferences, theme })}
              />
            ))}
          </View>
        </View>
        {(
          [
            ["largeText", "Büyük yazı", "Uygulamadaki metinleri büyüt."],
            [
              "highContrast",
              "Yüksek kontrast",
              "Metinleri ve ayırıcıları belirginleştir.",
            ],
            [
              "demo",
              "Sunum modu",
              "Rehber: 1 Ekim 2026, 17.00. EGO her zaman gerçek zamanı kullanır.",
            ],
          ] as const
        ).map(([key, label, description]) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 15,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Txt weight="600">{label}</Txt>
              <Txt size={12} muted>
                {description}
              </Txt>
            </View>
            <Switch
              accessibilityLabel={label}
              value={preferences[key]}
              onValueChange={(value) => {
                setPreferences({ ...preferences, [key]: value });
                if (key === "demo") setPlan(null);
              }}
              trackColor={{ false: colors.line, true: colors.green }}
            />
          </View>
        ))}
        <View style={{ gap: 12 }}>
          <Txt size={18} weight="700">
            Öğrenci durumu
          </Txt>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[true, false, undefined].map((v, i) => (
              <Chip
                key={i}
                label={
                  ["Öğrenciyim", "Öğrenci değilim", "Belirtmek istemiyorum"][i]
                }
                selected={profile.student === v}
                onPress={() => setProfile({ ...profile, student: v })}
              />
            ))}
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Txt size={18} weight="700">
            Konum ve gizlilik
          </Txt>
          <Txt size={13} muted>
            Yaş, öğrenci tercihi ve kayıtlar bu cihazda saklanır. Konum yalnızca
            yakınlık hesabı için bu oturumda kullanılır; sunucuya gönderilmez.
            Harita görselleri için OpenStreetMap’e bağlantı kurulur.
          </Txt>
          <Button
            label={profile.location ? "Konumu güncelle" : "Konumumu kullan"}
            variant="secondary"
            icon="locate-outline"
            onPress={locate}
          />
          {profile.location && (
            <Button
              label="Konumumu temizle"
              variant="ghost"
              onPress={() => setProfile({ ...profile, location: undefined })}
            />
          )}
        </View>
        <View style={{ gap: 10 }}>
          <Txt size={18} weight="700">
            Bu sürüm hakkında
          </Txt>
          <Txt size={13} muted>
            KentPusula 0.2.0 · Mobil MVP{"\n"}50 harita noktası · 86 hizmet ve
            kurs kaydı · EGO hat, sefer ve canlı durak bilgisi. Ses düğmesi
            örnek metin kullanır; sesli okuma cihaz desteğine bağlıdır.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
