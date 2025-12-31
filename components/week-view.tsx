import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekOfYear from "dayjs/plugin/weekOfYear";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";
import { CalendarEvent } from "@/lib/database";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

type Props = {
  selectedDate: string;
  events: CalendarEvent[];
  onDayPress: (date: string) => void;
  onEventPress?: (event: CalendarEvent) => void;
};

export function WeekView({
  selectedDate,
  events,
  onDayPress,
  onEventPress,
}: Props) {
  const weekDays = useMemo(() => {
    const current = dayjs(selectedDate);
    // 获取本周的周一
    const monday = current.isoWeekday(1);
    return Array.from({ length: 7 }, (_, i) => {
      const day = monday.add(i, "day");
      const isWeekend = i >= 5;
      return {
        date: day.format("YYYY-MM-DD"),
        dayNum: day.date(),
        dayName: WEEKDAYS[i],
        isToday: day.isSame(dayjs(), "day"),
        isSelected: day.format("YYYY-MM-DD") === selectedDate,
        isWeekend,
      };
    });
  }, [selectedDate]);

  // 按日期分组事件
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  // 计算事件在时间轴上的位置
  const getEventPosition = (event: CalendarEvent) => {
    if (!event.time) return { top: 0, height: 50 };
    const [hours, minutes] = event.time.split(":").map(Number);
    const top = hours * 50 + Math.floor((minutes * 50) / 60);
    return { top, height: 50 };
  };

  // 获取当前时间线位置
  const currentTimePosition = useMemo(() => {
    const now = dayjs();
    return now.hour() * 50 + Math.floor((now.minute() * 50) / 60);
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* 星期头部 */}
      <View style={styles.header}>
        <View style={styles.timeColumnHeader} />
        {weekDays.map((day) => (
          <Pressable
            key={day.date}
            style={styles.dayHeader}
            onPress={() => onDayPress(day.date)}
          >
            <ThemedText
              style={[
                styles.dayName,
                day.isWeekend && styles.weekendText,
                day.isToday && styles.todayName,
              ]}
            >
              {day.dayName}
            </ThemedText>
            <View
              style={[
                styles.dayNumContainer,
                day.isToday && styles.todayCircle,
                day.isSelected && !day.isToday && styles.selectedCircle,
              ]}
            >
              <ThemedText
                style={[
                  styles.dayNum,
                  day.isWeekend && styles.weekendText,
                  day.isToday && styles.todayNumText,
                  day.isSelected && !day.isToday && styles.selectedText,
                ]}
              >
                {day.dayNum}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 时间网格 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridContainer}>
          {/* 时间列 */}
          <View style={styles.timeColumn}>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <ThemedText style={styles.timeText}>
                  {hour.toString().padStart(2, "0")}:00
                </ThemedText>
              </View>
            ))}
          </View>

          {/* 每天的事件列 */}
          {weekDays.map((day, dayIndex) => (
            <Pressable
              key={day.date}
              style={[styles.dayColumn, day.isWeekend && styles.weekendColumn]}
              onPress={() => onDayPress(day.date)}
            >
              {/* 时间格子背景 */}
              {HOURS.map((hour) => (
                <View key={hour} style={styles.hourCell} />
              ))}

              {/* 当前时间线 */}
              {day.isToday && (
                <View style={[styles.nowLine, { top: currentTimePosition }]}>
                  <View style={styles.nowDot} />
                  <View style={styles.nowLineBar} />
                </View>
              )}

              {/* 事件 */}
              {eventsByDate[day.date]?.map((event) => {
                const pos = getEventPosition(event);
                return (
                  <Pressable
                    key={event.id}
                    style={[
                      styles.eventBlock,
                      {
                        top: pos.top,
                        height: pos.height,
                        backgroundColor: event.color || Colors.light.primary,
                      },
                    ]}
                    onPress={() => onEventPress?.(event)}
                  >
                    <ThemedText style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </ThemedText>
                    {event.time && (
                      <ThemedText style={styles.eventTime}>
                        {event.time}
                      </ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
  },
  timeColumnHeader: {
    width: 44,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dayName: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  weekendText: {
    color: Colors.light.weekend,
  },
  todayName: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  dayNumContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  todayCircle: {
    backgroundColor: Colors.light.primary,
  },
  todayNumText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  selectedCircle: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  selectedText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
  },
  timeColumn: {
    width: 44,
  },
  timeSlot: {
    height: 50,
    justifyContent: "flex-start",
    paddingTop: 0,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.light.textTertiary,
  },
  dayColumn: {
    flex: 1,
    position: "relative",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.light.borderLight,
  },
  weekendColumn: {
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  hourCell: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.borderLight,
  },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.danger,
    marginLeft: -4,
  },
  nowLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.danger,
  },
  eventBlock: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: BorderRadius.xs,
    padding: 4,
    overflow: "hidden",
    ...Shadows.sm,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  eventTime: {
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
  },
});
