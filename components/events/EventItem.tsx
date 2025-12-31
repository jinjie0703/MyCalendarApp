/**
 * 单个事件卡片组件
 */

import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";
import { CalendarEvent } from "@/lib/database";

interface Props {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export function EventItem({ event, onPress, onDelete }: Props) {
  const handleDelete = (e: any) => {
    e.stopPropagation();
    Alert.alert("删除事件", `确定删除"${event.title}"吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => onDelete(event.id),
      },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={() => onPress(event)}
    >
      <View
        style={[
          styles.colorBar,
          { backgroundColor: event.color || Colors.light.primary },
        ]}
      />
      <View style={styles.content}>
        <ThemedText style={styles.title}>{event.title}</ThemedText>
        {event.time && (
          <View style={styles.timeRow}>
            <IconSymbol
              name="clock"
              size={12}
              color={Colors.light.textSecondary}
            />
            <ThemedText style={styles.time}>{event.time}</ThemedText>
          </View>
        )}
        {event.description && (
          <ThemedText style={styles.description} numberOfLines={1}>
            {event.description}
          </ThemedText>
        )}
      </View>
      <Pressable onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
        <IconSymbol name="trash" size={18} color={Colors.light.danger} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 12,
    ...Shadows.sm,
  },
  containerPressed: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  colorBar: {
    width: 4,
    height: "100%",
    minHeight: 40,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  deleteBtn: {
    padding: 8,
  },
});
