import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";
import { CalendarEvent } from "@/lib/database";
import { getLunar } from "chinese-lunar-calendar";
import { Solar } from "lunar-javascript";

dayjs.locale("zh-cn");

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type Props = {
  selectedDate: string;
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
};

export function DayView({ selectedDate, events, onEventPress }: Props) {
  const dateInfo = useMemo(() => {
    const d = dayjs(selectedDate);
    const date = new Date(selectedDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const isToday = d.isSame(dayjs(), "day");

    let lunarInfo = { lunarDay: "", lunarMonth: "" };
    try {
      const lunar = getLunar(date.getFullYear(), month, day);
      lunarInfo = {
        lunarDay: String((lunar as any).dateStr || "").replace(/^.+月/, ""),
        lunarMonth: String((lunar as any).lunarMonth),
      };
    } catch {}

    let almanacInfo = { yi: [] as string[], ji: [] as string[], ganZhi: "" };
    try {
      const solar = Solar.fromYmd(date.getFullYear(), month, day);
      const lunar = solar.getLunar();
      almanacInfo = {
        yi: lunar.getDayYi().slice(0, 4),
        ji: lunar.getDayJi().slice(0, 4),
        ganZhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
      };
    } catch {}

    return {
      weekday: d.format("dddd"),
      dateStr: d.format("M月D日"),
      fullDate: d.format("YYYY年M月D日"),
      lunarStr: lunarInfo.lunarDay
        ? `农历${lunarInfo.lunarMonth}月${lunarInfo.lunarDay}`
        : "",
      isToday,
      ...almanacInfo,
    };
  }, [selectedDate]);

  // 按时间排序事件
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return -1;
      if (!b.time) return 1;
      return a.time.localeCompare(b.time);
    });
  }, [events]);

  // 全天事件和定时事件分开
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    sortedEvents.forEach((e) => {
      if (!e.time) {
        allDay.push(e);
      } else {
        timed.push(e);
      }
    });
    return { allDayEvents: allDay, timedEvents: timed };
  }, [sortedEvents]);

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
      {/* 日期信息头部 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.dateTitle}>{dateInfo.dateStr}</ThemedText>
            <ThemedText style={styles.weekdayText}>
              {dateInfo.weekday}
              {dateInfo.isToday && (
                <ThemedText style={styles.todayBadge}> · 今天</ThemedText>
              )}
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <ThemedText style={styles.lunarText}>
              {dateInfo.lunarStr}
            </ThemedText>
            {dateInfo.ganZhi ? (
              <ThemedText style={styles.ganZhiText}>
                {dateInfo.ganZhi}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* 宜忌信息 */}
        <View style={styles.almanacContainer}>
          {dateInfo.yi.length > 0 && (
            <View style={styles.almanacRow}>
              <View style={styles.yiLabel}>
                <ThemedText style={styles.labelText}>宜</ThemedText>
              </View>
              <ThemedText style={styles.almanacText} numberOfLines={1}>
                {dateInfo.yi.join(" · ")}
              </ThemedText>
            </View>
          )}
          {dateInfo.ji.length > 0 && (
            <View style={styles.almanacRow}>
              <View style={styles.jiLabel}>
                <ThemedText style={styles.labelText}>忌</ThemedText>
              </View>
              <ThemedText style={styles.almanacText} numberOfLines={1}>
                {dateInfo.ji.join(" · ")}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* 全天事件 */}
      {allDayEvents.length > 0 && (
        <View style={styles.allDaySection}>
          <View style={styles.allDayHeader}>
            <IconSymbol
              name="sun.max"
              size={14}
              color={Colors.light.textSecondary}
            />
            <ThemedText style={styles.sectionTitle}>全天事件</ThemedText>
          </View>
          {allDayEvents.map((event) => (
            <Pressable
              key={event.id}
              style={({ pressed }) => [
                styles.allDayEvent,
                { backgroundColor: event.color || Colors.light.primary },
                pressed && styles.eventPressed,
              ]}
              onPress={() => onEventPress?.(event)}
            >
              <ThemedText style={styles.allDayEventTitle}>
                {event.title}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {/* 时间轴 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timelineContainer}>
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

          {/* 事件区域 */}
          <View style={styles.eventsColumn}>
            {/* 时间格子背景 */}
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourCell} />
            ))}

            {/* 当前时间线 */}
            {dateInfo.isToday && (
              <View style={[styles.nowLine, { top: currentTimePosition }]}>
                <View style={styles.nowDot} />
                <View style={styles.nowLineBar} />
              </View>
            )}

            {/* 事件块 */}
            {timedEvents.map((event) => {
              const pos = getEventPosition(event);
              return (
                <Pressable
                  key={event.id}
                  style={({ pressed }) => [
                    styles.eventBlock,
                    {
                      top: pos.top,
                      height: pos.height,
                      backgroundColor: event.color || Colors.light.primary,
                    },
                    pressed && styles.eventPressed,
                  ]}
                  onPress={() => onEventPress?.(event)}
                >
                  <ThemedText style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </ThemedText>
                  <ThemedText style={styles.eventTime}>{event.time}</ThemedText>
                  {event.description && (
                    <ThemedText style={styles.eventDesc} numberOfLines={1}>
                      {event.description}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>
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
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  dateTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  weekdayText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  todayBadge: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  lunarText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  ganZhiText: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  almanacContainer: {
    gap: 8,
  },
  almanacRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  yiLabel: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  jiLabel: {
    backgroundColor: Colors.light.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  almanacText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  allDaySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: 8,
  },
  allDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  allDayEvent: {
    padding: 10,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  allDayEventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  eventPressed: {
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  timelineContainer: {
    flexDirection: "row",
  },
  timeColumn: {
    width: 50,
  },
  timeSlot: {
    height: 50,
    justifyContent: "flex-start",
    paddingTop: 0,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.light.textTertiary,
  },
  eventsColumn: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderLight,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.danger,
    marginLeft: -5,
  },
  nowLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.danger,
  },
  eventBlock: {
    position: "absolute",
    left: 4,
    right: 8,
    borderRadius: BorderRadius.sm,
    padding: 8,
    overflow: "hidden",
    ...Shadows.sm,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  eventTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  eventDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
});
