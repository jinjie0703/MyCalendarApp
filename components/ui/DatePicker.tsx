/**
 * DatePicker - 日期选择器组件
 * 组合三个 WheelPicker 实现年月日选择
 * 支持月份变化时自动调整天数，正确处理闰年
 */

import { Colors } from "@/constants/theme";
import {
    clampDay,
    generateDayRange,
    generateMonthRange,
    generateYearRange,
    parseDateComponents,
} from "@/lib/date-utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { WheelItem, WheelPicker } from "./WheelPicker";

/**
 * DatePicker 组件属性
 */
export interface DatePickerProps {
  /** 当前选中日期 */
  value: Date;
  /** 日期变化回调 */
  onChange: (date: Date) => void;
  /** 最小年份，默认当前年份 - 50 */
  minYear?: number;
  /** 最大年份，默认当前年份 + 50 */
  maxYear?: number;
}

/**
 * DatePicker 日期选择器组件
 * 使用三个 WheelPicker 分别选择年、月、日
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minYear,
  maxYear,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // 计算默认年份范围
  const currentYear = new Date().getFullYear();
  const effectiveMinYear = minYear ?? currentYear - 50;
  const effectiveMaxYear = maxYear ?? currentYear + 50;

  // 解析当前日期值，处理无效日期
  const getValidDateComponents = useCallback(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return parseDateComponents(value);
    }
    // 如果日期无效，返回当前日期
    return parseDateComponents(new Date());
  }, [value]);

  const initialComponents = getValidDateComponents();

  // 内部状态管理年月日
  const [year, setYear] = useState(initialComponents.year);
  const [month, setMonth] = useState(initialComponents.month);
  const [day, setDay] = useState(initialComponents.day);

  // 当外部 value 变化时，同步内部状态
  useEffect(() => {
    const components = getValidDateComponents();
    setYear(components.year);
    setMonth(components.month);
    setDay(components.day);
  }, [value, getValidDateComponents]);

  // 生成年份选项
  const yearData: WheelItem[] = useMemo(
    () => generateYearRange(effectiveMinYear, effectiveMaxYear),
    [effectiveMinYear, effectiveMaxYear]
  );

  // 生成月份选项 (固定 1-12)
  const monthData: WheelItem[] = useMemo(() => generateMonthRange(), []);

  // 生成日期选项 (根据年月动态变化)
  const dayData: WheelItem[] = useMemo(
    () => generateDayRange(year, month),
    [year, month]
  );

  // 通知父组件日期变化
  const notifyChange = useCallback(
    (newYear: number, newMonth: number, newDay: number) => {
      // 确保日期在有效范围内
      const validDay = clampDay(newYear, newMonth, newDay);
      const newDate = new Date(newYear, newMonth - 1, validDay);
      onChange(newDate);
    },
    [onChange]
  );

  // 处理年份变化
  const handleYearChange = useCallback(
    (newValue: string | number) => {
      const newYear = Number(newValue);
      setYear(newYear);
      // 调整日期以适应新年份（处理闰年2月29日的情况）
      const validDay = clampDay(newYear, month, day);
      if (validDay !== day) {
        setDay(validDay);
      }
      notifyChange(newYear, month, validDay);
    },
    [month, day, notifyChange]
  );

  // 处理月份变化
  const handleMonthChange = useCallback(
    (newValue: string | number) => {
      const newMonth = Number(newValue);
      setMonth(newMonth);
      // 调整日期以适应新月份
      const validDay = clampDay(year, newMonth, day);
      if (validDay !== day) {
        setDay(validDay);
      }
      notifyChange(year, newMonth, validDay);
    },
    [year, day, notifyChange]
  );

  // 处理日期变化
  const handleDayChange = useCallback(
    (newValue: string | number) => {
      const newDay = Number(newValue);
      setDay(newDay);
      notifyChange(year, month, newDay);
    },
    [year, month, notifyChange]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* 年份选择器 */}
      <WheelPicker
        data={yearData}
        selectedValue={year}
        onValueChange={handleYearChange}
        width={100}
      />
      {/* 月份选择器 */}
      <WheelPicker
        data={monthData}
        selectedValue={month}
        onValueChange={handleMonthChange}
        width={80}
      />
      {/* 日期选择器 */}
      <WheelPicker
        data={dayData}
        selectedValue={day}
        onValueChange={handleDayChange}
        width={80}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DatePicker;
