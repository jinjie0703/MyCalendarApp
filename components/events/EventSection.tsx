/**
 * 事件区域组件
 * 包含标题、添加按钮和事件列表/空状态
 */

import { CalendarEvent } from "@/lib/database";
import dayjs from "dayjs";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyEvents } from "./EmptyEvents";
import { EventList } from "./EventList";

interface Props {
  selectedDate: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
}

export function EventSection({
  selectedDate,
  events,
  onEventPress,
  onEventDelete,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {dayjs(selectedDate).format("M月D日")} 日程
        </Text>
      </View>

      {events.length === 0 ? (
        <EmptyEvents onAddEvent={() => {}} />
      ) : (
        <EventList
          events={events}
          onEventPress={onEventPress}
          onEventDelete={onEventDelete}
        />
      )}
    </View>
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
    color: "#000",
  },
});
