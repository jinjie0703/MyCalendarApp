import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";

dayjs.locale("zh-cn");

type Props = {
  selectedDate: string; // YYYY-MM-DD

  onPressToday: () => void;
  onPressSearch?: () => void;
  onPressMore?: (anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
};

export function CalendarHeader({
  selectedDate,
  onPressToday,
  onPressSearch,
  onPressMore,
}: Props) {
  const moreRef = useRef<View>(null);
  const info = useMemo(() => {
    const d = dayjs(selectedDate, "YYYY-MM-DD", true);
    const month = d.isValid() ? d.format("M") : "--";
    const year = d.isValid() ? d.format("YYYY") : "----";
    const monthName = d.isValid() ? d.format("MMMM") : "";
    const weekday = d.isValid() ? d.format("dddd") : "";

    const today = dayjs().startOf("day");
    const diffDays = d.isValid() ? d.startOf("day").diff(today, "day") : 0;
    const isToday = diffDays === 0;

    return { month, year, monthName, weekday, isToday, diffDays };
  }, [selectedDate]);

  return (
    <ThemedView style={styles.container}>
      {/* 左侧：月份大标题 */}
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.monthText}>{info.month}月</ThemedText>
          <ThemedText style={styles.yearText}>{info.year}</ThemedText>
        </View>
        <ThemedText style={styles.weekdayText}>
          {info.weekday}
          {info.isToday && (
            <ThemedText style={styles.todayBadge}> · 今天</ThemedText>
          )}
        </ThemedText>
      </View>

      {/* 右侧：操作按钮 */}
      <View style={styles.actions}>
        {onPressSearch && (
          <Pressable
            onPress={onPressSearch}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={Colors.light.primary}
            />
          </Pressable>
        )}
        <Pressable
          onPress={onPressToday}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <IconSymbol name="calendar" size={20} color={Colors.light.primary} />
        </Pressable>
        <View ref={moreRef} collapsable={false}>
          <Pressable
            onPress={() => {
              if (!onPressMore) return;
              moreRef.current?.measureInWindow((x, y, width, height) => {
                onPressMore({ x, y, width, height });
              });
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <IconSymbol
              name="ellipsis"
              size={20}
              color={Colors.light.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  monthText: {
    fontSize: 25,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  weekdayText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  todayBadge: {
    fontSize: 15,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSecondary,
  },
  iconBtnPressed: {
    backgroundColor: Colors.light.borderLight,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  addBtnPressed: {
    opacity: 0.8,
  },
});
