import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import dayjs from "dayjs";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Props = {
  selectedDate: string; // YYYY-MM-DD
  onPressAdd: () => void;
  onPressToday: () => void;
  onPressMore?: (anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
};

export function CalendarHeader({
  selectedDate,
  onPressAdd,
  onPressToday,
  onPressMore,
}: Props) {
  const moreRef = useRef<View>(null);
  const info = useMemo(() => {
    const d = dayjs(selectedDate, "YYYY-MM-DD", true);
    const month = d.isValid() ? d.format("M") : "--";
    const year = d.isValid() ? d.format("YYYY") : "----";
    const dateLabel = d.isValid() ? d.format("M月D日") : "--";

    const today = dayjs().startOf("day");
    const diffDays = d.isValid() ? d.startOf("day").diff(today, "day") : 0;
    const diffLabel =
      diffDays === 0
        ? "今天"
        : diffDays > 0
        ? `${diffDays} 天后`
        : `${Math.abs(diffDays)} 天前`;

    return { month, year, dateLabel, diffLabel };
  }, [selectedDate]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.left}>
        <ThemedText style={styles.month}>{info.month}</ThemedText>
        <View style={styles.leftText}>
          <ThemedText style={styles.year}>{info.year}</ThemedText>
          <View style={styles.dateRow}>
            <ThemedText style={styles.date}>{info.dateLabel}</ThemedText>
            <ThemedText style={styles.diff}>{info.diffLabel}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onPressAdd} hitSlop={10} style={styles.iconBtn}>
          <IconSymbol name="plus" size={22} color="#111" />
        </Pressable>
        <Pressable onPress={onPressToday} hitSlop={10} style={styles.iconBtn}>
          <IconSymbol name="calendar" size={22} color="#111" />
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
            style={styles.iconBtn}
          >
            <IconSymbol name="ellipsis" size={22} color="#111" />
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
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  month: {
    fontSize: 44,
    fontWeight: "700",
    lineHeight: 48,
  },
  leftText: {
    gap: 2,
    paddingBottom: 4,
  },
  year: {
    fontSize: 16,
    opacity: 0.7,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  date: {
    fontSize: 18,
    fontWeight: "600",
  },
  diff: {
    fontSize: 16,
    opacity: 0.65,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
  },
});
