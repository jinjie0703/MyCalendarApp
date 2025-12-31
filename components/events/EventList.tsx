/**
 * 事件列表组件
 */

import React from "react";
import { StyleSheet, View } from "react-native";

import { CalendarEvent } from "@/lib/database";
import { EventItem } from "./EventItem";

interface Props {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
}

export function EventList({ events, onEventPress, onEventDelete }: Props) {
  return (
    <View style={styles.container}>
      {events.map((event) => (
        <EventItem
          key={event.id}
          event={event}
          onPress={onEventPress}
          onDelete={onEventDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});
