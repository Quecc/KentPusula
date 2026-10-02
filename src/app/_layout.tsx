import React from "react";
import { Stack } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../../hooks/useApp";
import { useTheme } from "../../theme";
import { Icon, Txt } from "../../components/ui";

function RootStack() {
  const { colors } = useTheme();
  const { notice, setNotice } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      />
      {!!notice && (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            bottom: 90,
            left: 20,
            right: 20,
            padding: 14,
            borderRadius: 8,
            backgroundColor: colors.ink,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Txt size={13} style={{ color: colors.bg, flex: 1 }}>
            {notice}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bildirimi kapat"
            onPress={() => setNotice("")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" color={colors.bg} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}
