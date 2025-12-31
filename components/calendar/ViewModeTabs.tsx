/**
 * 视图模式切换标签组件
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";

export type ViewMode = "month" | "week" | "day";

interface Props {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  month: "月",
  week: "周",
  day: "日",
};

export function ViewModeTabs({ viewMode, onChange }: Props) {
  return (
    <View style={styles.container}>
      {(["month", "week", "day"] as const).map((mode) => (
        <Pressable
          key={mode}
          style={[styles.tab, viewMode === mode && styles.tabActive]}
          onPress={() => onChange(mode)}
        >
          <ThemedText
            style={[styles.tabText, viewMode === mode && styles.tabTextActive]}
          >
            {VIEW_MODE_LABELS[mode]}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.light.text,
    fontWeight: "600",
  },
});
