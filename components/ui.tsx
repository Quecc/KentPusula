import React from "react";
import {
  Pressable,
  StyleProp,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme";

export function Txt({
  children,
  size = 15,
  weight = "400",
  muted = false,
  style,
  ...props
}: TextProps & {
  size?: number;
  weight?: TextStyle["fontWeight"];
  muted?: boolean;
}) {
  const { colors, scale } = useTheme();
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.ink,
          fontSize: size * scale,
          lineHeight: size * scale * 1.32,
          fontWeight: weight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name as React.ComponentProps<typeof Ionicons>["name"]}
      size={size}
      color={color ?? colors.ink}
      accessible={false}
    />
  );
}
export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const foreground = variant === "primary" ? colors.bg : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: 50,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 13,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          backgroundColor:
            variant === "primary"
              ? colors.ink
              : variant === "secondary"
                ? colors.panel
                : "transparent",
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.line,
        },
        style,
      ]}
    >
      <Txt weight="600" style={{ color: foreground, flexShrink: 1 }}>
        {label}
      </Txt>
      {icon && <Icon name={icon} size={19} color={foreground} />}
    </Pressable>
  );
}
export function IconButton({
  label,
  icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 46,
        minHeight: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: active ? colors.accentSoft : "transparent",
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Icon name={icon} color={active ? colors.accent : colors.ink} />
    </Pressable>
  );
}
export function Chip({
  label,
  onPress,
  selected = false,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? colors.ink : colors.line,
        backgroundColor: selected ? colors.ink : colors.panel,
        paddingHorizontal: 14,
        minHeight: 44,
        justifyContent: "center",
        borderRadius: 22,
      }}
    >
      <Txt
        size={13}
        weight="600"
        style={{ color: selected ? colors.bg : colors.ink }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Badge({
  text,
  warm = false,
}: {
  text: string;
  warm?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: warm ? colors.accentSoft : colors.greenSoft,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 99,
      }}
    >
      <Txt
        size={11}
        weight="700"
        style={{ color: warm ? colors.accent : colors.green }}
      >
        {text}
      </Txt>
    </View>
  );
}
export function SectionHeading({
  title,
  caption,
  action,
  onPress,
}: {
  title: string;
  caption?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt size={23} weight="700">
          {title}
        </Txt>
        {caption && (
          <Txt size={13} muted style={{ marginTop: 4 }}>
            {caption}
          </Txt>
        )}
      </View>
      {action && (
        <Button
          label={action}
          onPress={onPress!}
          variant="ghost"
          icon="arrow-forward"
        />
      )}
    </View>
  );
}
export function Empty({
  title,
  description,
  action,
  onPress,
}: {
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: 28,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 18,
        gap: 16,
      }}
    >
      <Icon name="compass-outline" size={34} />
      <Txt size={22} weight="700">
        {title}
      </Txt>
      <Txt muted>{description}</Txt>
      <Button
        label={action}
        onPress={onPress}
        variant="secondary"
        icon="arrow-forward"
      />
    </View>
  );
}
