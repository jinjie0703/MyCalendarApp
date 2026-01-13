/**
 * TimePicker - 时间选择器组件
 * 组合两个 WheelPicker 实现小时和分钟选择
 * 使用 24 小时制
 */

import { Colors } from "@/constants/theme";
import {
    generateHourRange,
    generateMinuteRange,
    parseTimeString,
} from "@/lib/date-utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { WheelItem, WheelPicker } from "./WheelPicker";

/**
 * TimePicker 组件属性
 */
export interface TimePickerProps {
  /** 当前选中时间 (HH:mm 格式) */
  value: string;
  /** 时间变化回调 */
  onChange: (time: string) => void;
  /** 分钟间隔，默认 1 */
  minuteInterval?: number;
}

/**
 * TimePicker 时间选择器组件
 * 使用两个 WheelPicker 分别选择小时和分钟
 * 采用 24 小时制 (0-23 小时)
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  minuteInterval = 1,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // 解析当前时间值，处理无效时间
  const getValidTimeComponents = useCallback(() => {
    if (value && typeof value === "string" && value.includes(":")) {
      const components = parseTimeString(value);
      // 验证小时和分钟范围
      const validHour = Math.max(0, Math.min(23, components.hour));
      const validMinute = Math.max(0, Math.min(59, components.minute));
      return { hour: validHour, minute: validMinute };
    }
    // 如果时间无效，返回当前时间
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }, [value]);

  const initialComponents = getValidTimeComponents();

  // 内部状态管理小时和分钟
  const [hour, setHour] = useState(initialComponents.hour);
  const [minute, setMinute] = useState(initialComponents.minute);

  // 当外部 value 变化时，同步内部状态
  useEffect(() => {
    const components = getValidTimeComponents();
    setHour(components.hour);
    setMinute(components.minute);
  }, [value, getValidTimeComponents]);

  // 生成小时选项 (0-23)
  const hourData: WheelItem[] = useMemo(() => generateHourRange(), []);

  // 生成分钟选项 (根据间隔)
  const minuteData: WheelItem[] = useMemo(
    () => generateMinuteRange(minuteInterval),
    [minuteInterval]
  );

  // 格式化时间字符串
  const formatTimeValue = useCallback((h: number, m: number): string => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, []);

  // 通知父组件时间变化
  const notifyChange = useCallback(
    (newHour: number, newMinute: number) => {
      const timeString = formatTimeValue(newHour, newMinute);
      onChange(timeString);
    },
    [onChange, formatTimeValue]
  );

  // 处理小时变化
  const handleHourChange = useCallback(
    (newValue: string | number) => {
      const newHour = Number(newValue);
      setHour(newHour);
      notifyChange(newHour, minute);
    },
    [minute, notifyChange]
  );

  // 处理分钟变化
  const handleMinuteChange = useCallback(
    (newValue: string | number) => {
      const newMinute = Number(newValue);
      setMinute(newMinute);
      notifyChange(hour, newMinute);
    },
    [hour, notifyChange]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* 小时选择器 */}
      <WheelPicker
        data={hourData}
        selectedValue={hour}
        onValueChange={handleHourChange}
        width={80}
      />
      {/* 分隔符 */}
      <View style={styles.separator}>
        <View style={[styles.separatorDot, { backgroundColor: colors.text }]} />
        <View style={[styles.separatorDot, { backgroundColor: colors.text }]} />
      </View>
      {/* 分钟选择器 */}
      <WheelPicker
        data={minuteData}
        selectedValue={minute}
        onValueChange={handleMinuteChange}
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
  separator: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 8,
    gap: 8,
  },
  separatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default TimePicker;
