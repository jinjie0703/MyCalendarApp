import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Props = {
  title: string;
  description?: string;
  rightLabel?: string;
  type?: "link" | "switch";
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
};

export function SettingsItem({
  title,
  description,
  rightLabel,
  type = "link",
  value,
  onPress,
  onValueChange,
  disabled,
}: Props) {
  const content = (
    <ThemedView style={styles.row}>
      <View style={styles.left}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {!!description && (
          <ThemedText style={styles.desc} numberOfLines={2}>
            {description}
          </ThemedText>
        )}
      </View>

      <View style={styles.right}>
        {!!rightLabel && (
          <ThemedText style={styles.rightLabel} numberOfLines={1}>
            {rightLabel}
          </ThemedText>
        )}

        {type === "switch" ? (
          <Switch value={!!value} onValueChange={onValueChange} />
        ) : (
          <IconSymbol name="chevron.right" size={18} color="rgba(0,0,0,0.35)" />
        )}
      </View>
    </ThemedView>
  );

  if (type === "switch") {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(0,0,0,0.85)",
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.65,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightLabel: {
    fontSize: 13,
    opacity: 0.65,
    maxWidth: 140,
    textAlign: "right",
  },
});

