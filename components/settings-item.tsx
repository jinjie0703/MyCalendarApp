import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";

type Props = {
  title: string;
  description?: string;
  rightLabel?: string;
  type?: "link" | "switch";
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  destructive?: boolean;
  showArrow?: boolean;
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
  destructive,
  showArrow,
}: Props) {
  const content = (
    <ThemedView style={styles.row}>
      <View style={styles.left}>
        <ThemedText
          style={[styles.title, destructive && styles.destructiveText]}
        >
          {title}
        </ThemedText>
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
          <Switch
            value={!!value}
            onValueChange={onValueChange}
            trackColor={{
              false: Colors.light.border,
              true: Colors.light.primary,
            }}
            thumbColor="#fff"
          />
        ) : showArrow || type === "link" ? (
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors.light.textTertiary}
          />
        ) : null}
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
    borderRadius: 12,
  },
  pressed: {
    backgroundColor: Colors.light.background,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  left: {
    flex: 1,
    paddingRight: 16,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  destructiveText: {
    color: Colors.light.danger,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rightLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    maxWidth: 150,
    textAlign: "right",
  },
});
