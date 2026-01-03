/**
 * 事件区域组件
 * 包含标题、添加按钮和事件列表/空状态
 */

import dayjs from "dayjs";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { CalendarEvent } from "@/lib/database";

import { EmptyEvents } from "./EmptyEvents";
import { EventList } from "./EventList";

interface Props {
  selectedDate: string;
  events: CalendarEvent[];
  onAddEvent: () => void;
  onEventPress: (event: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
}

export function EventSection({
  selectedDate,
  events,
  onAddEvent,
  onEventPress,
  onEventDelete,
}: Props) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          {dayjs(selectedDate).format("M月D日")} 日程
        </ThemedText>
        <Pressable onPress={onAddEvent} style={styles.addBtn}>
          <IconSymbol name="plus" size={14} color={Colors.light.primary} />
        </Pressable>
      </View>

      {events.length === 0 ? (
        <EmptyEvents onAddEvent={onAddEvent} />
      ) : (
        <EventList
          events={events}
          onEventPress={onEventPress}
          onEventDelete={onEventDelete}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
});
