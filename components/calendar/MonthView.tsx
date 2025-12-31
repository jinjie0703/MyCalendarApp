/**
 * 月视图组件
 * 包含日历网格和农历显示
 */

import React, { useMemo } from "react";
import { Calendar } from "react-native-calendars";

import { CalendarDay } from "./CalendarDay";

interface Props {
  selectedDate: string;
  calendarKey?: number;
  onDayPress: (dateString: string) => void;
}

export function MonthView({ selectedDate, calendarKey, onDayPress }: Props) {
  // 构建 markedDates（用于 Calendar 组件的标记功能）
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    marked[selectedDate] = {
      selected: true,
      selectedColor: "#A1CEDC",
    };

    return marked;
  }, [selectedDate]);

  return (
    <Calendar
      key={calendarKey}
      current={selectedDate}
      onDayPress={(d) => onDayPress(d.dateString)}
      markedDates={markedDates}
      enableSwipeMonths
      dayComponent={({ date, state }: any) => {
        const dateString = date?.dateString;
        if (!dateString) return null;

        return (
          <CalendarDay
            date={date}
            state={state}
            isSelected={dateString === selectedDate}
            onPress={onDayPress}
          />
        );
      }}
    />
  );
}
