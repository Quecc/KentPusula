import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { CityService, Coordinates } from "../types";
import { useTheme } from "../theme";
import { useApp } from "../hooks/useApp";
import { Button, Txt } from "./ui";
import { nativeMapHtml, nativeMapUpdateScript } from "../services/mapDocument";
import { openLink } from "../utils/links";

export function ServiceMap({
  items,
  center,
  selected,
  onSelect,
}: {
  items: CityService[];
  center: Coordinates;
  selected?: string;
  onSelect: (service: CityService) => void;
}) {
  const { colors } = useTheme();
  const { setNotice } = useApp();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const webview = useRef<WebView>(null);
  const [initialHtml] = useState(() => nativeMapHtml(items, center, selected));
  const source = useMemo(
    () => ({ html: initialHtml, baseUrl: "https://www.openstreetmap.org/" }),
    [initialHtml],
  );
  const update = nativeMapUpdateScript(items, center, selected);
  useEffect(() => {
    webview.current?.injectJavaScript(update);
  }, [update]);
  return (
    <View
      style={{
        height: 440,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: colors.map,
      }}
    >
      <WebView
        key={attempt}
        ref={webview}
        source={source}
        originWhitelist={["*"]}
        style={{ backgroundColor: colors.map }}
        javaScriptEnabled
        applicationNameForUserAgent="KentPusula/0.3.0"
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        mixedContentMode="never"
        onError={() => setStatus("error")}
        onHttpError={() => setStatus("error")}
        onLoadStart={() => setStatus("loading")}
        onLoadEnd={() => webview.current?.injectJavaScript(update)}
        onMessage={(event) => {
          try {
            const message: unknown = JSON.parse(event.nativeEvent.data);
            if (!message || typeof message !== "object") return;
            const value = message as Record<string, unknown>;
            if (value.type === "initialized")
              webview.current?.injectJavaScript(update);
            if (value.type === "ready") setStatus("ready");
            if (value.type === "error") setStatus("error");
            if (value.type === "select" && typeof value.id === "string") {
              const service = items.find((item) => item.id === value.id);
              if (service) onSelect(service);
            }
            if (value.type === "attribution")
              void openLink(
                "https://www.openstreetmap.org/copyright",
                setNotice,
              );
          } catch {
            /* Ignore messages outside the map bridge schema. */
          }
        }}
        onShouldStartLoadWithRequest={({ url }) =>
          url === "about:blank" || url === "https://www.openstreetmap.org/"
        }
      />
      {status === "loading" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            backgroundColor: colors.panel,
            padding: 10,
            borderRadius: 14,
          }}
        >
          <ActivityIndicator
            color={colors.accent}
            accessibilityLabel="Harita yükleniyor"
          />
        </View>
      )}
      {status === "error" && (
        <View
          style={{
            position: "absolute",
            bottom: 32,
            left: 16,
            right: 16,
            padding: 16,
            backgroundColor: colors.panel,
            borderRadius: 16,
            gap: 10,
          }}
        >
          <Txt size={14} weight="600">
            Harita bağlantısı kurulamadı.
          </Txt>
          <Button
            label="Yeniden yükle"
            variant="secondary"
            onPress={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          />
        </View>
      )}
    </View>
  );
}
