/**
 * 空事件状态组件
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors } from "@/constants/theme";

interface Props {
  onAddEvent: () => void;
}

export function EmptyEvents({ onAddEvent }: Props) {
  return (
    <View style={styles.container}>
      <IconSymbol
        name="calendar.badge.plus"
        size={40}
        color={Colors.light.textTertiary}
      />
      <ThemedText style={styles.text}>暂无日程安排</ThemedText>
      <Pressable style={styles.button} onPress={onAddEvent}>
        <ThemedText style={styles.buttonText}>创建新日程</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  text: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
