import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { useTheme } from "../theme";
import { Button } from "./ui";
import { DEMO_QUERY } from "../data/catalog";

export function NeedInput({
  onSubmit,
  initial = "",
  busy = false,
}: {
  onSubmit: (value: string) => void;
  initial?: string;
  busy?: boolean;
}) {
  const [text, setText] = useState(initial);
  const { colors, scale } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 18,
        padding: 17,
        gap: 12,
      }}
    >
      <TextInput
        accessibilityLabel="İhtiyacını yaz"
        placeholder="Neye ihtiyacın var?"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={600}
        style={{
          color: colors.ink,
          fontSize: 17 * scale,
          lineHeight: 25 * scale,
          minHeight: 62,
          textAlignVertical: "top",
          padding: 2,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Button
          label="Örnek istek"
          variant="ghost"
          onPress={() => setText(DEMO_QUERY)}
          style={{ paddingHorizontal: 0 }}
        />
        <Button
          label={busy ? "Plan hazırlanıyor…" : "Yol göster"}
          icon="arrow-forward"
          disabled={busy || !text.trim()}
          onPress={() => onSubmit(text.trim())}
        />
      </View>
    </View>
  );
}
