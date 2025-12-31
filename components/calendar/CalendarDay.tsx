/**
 * 日历单日格子组件
 * 显示公历日期和农历/节日/节气信息
 */

import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getLunarDate } from "@/lib/lunar";

interface Props {
  date: {
    dateString: string;
    day: number;
    month: number;
    year: number;
  };
  state?: "disabled" | "today" | "";
  isSelected: boolean;
  onPress: (dateString: string) => void;
}

export function CalendarDay({ date, state, isSelected, onPress }: Props) {
  const lunarInfo = getLunarDate(date.dateString);

  // 显示优先级：节日 >= 节气 > 农历日期
  const subLabel =
    lunarInfo.isFestival || lunarInfo.isTerm || lunarInfo.lunarDay || "";

  const isFestival = !!lunarInfo.isFestival;
  const isTerm = !!lunarInfo.isTerm;

  return (
    <Pressable
      onPress={() => onPress(date.dateString)}
      style={[styles.container, isSelected && styles.containerSelected]}
    >
      <ThemedText
        style={[
          styles.dayText,
          isSelected && styles.dayTextSelected,
          state === "disabled" && styles.dayTextDisabled,
        ]}
      >
        {date.day}
      </ThemedText>
      <ThemedText
        style={[
          styles.lunarText,
          isFestival && styles.lunarTextFestival,
          isTerm && !isFestival && styles.lunarTextTerm,
        ]}
        numberOfLines={1}
      >
        {subLabel}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "transparent",
    minWidth: 36,
  },
  containerSelected: {
    backgroundColor: "#A1CEDC",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    lineHeight: 18,
  },
  dayTextSelected: {
    fontWeight: "700",
  },
  dayTextDisabled: {
    color: "rgba(0,0,0,0.35)",
  },
  lunarText: {
    fontSize: 10,
    opacity: 0.75,
    color: "rgba(0,0,0,0.7)",
    lineHeight: 12,
  },
  lunarTextFestival: {
    opacity: 1,
    color: "#C0392B",
  },
  lunarTextTerm: {
    opacity: 1,
    color: "#0E7C86",
  },
});
