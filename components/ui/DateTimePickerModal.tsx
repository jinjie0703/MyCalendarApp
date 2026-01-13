/**
 * DateTimePickerModal - 日期时间选择模态框组件
 * 整合 DatePicker 和 TimePicker，提供底部弹出的模态选择界面
 * 支持 date/time/datetime 三种模式
 */

import { BorderRadius, Colors, Shadows, Spacing } from "@/constants/theme";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * DateTimePickerModal 组件属性
 */
export interface DateTimePickerModalProps {
  /** 是否显示 */
  visible: boolean;
  /** 选择模式: date-仅日期, time-仅时间, datetime-日期和时间 */
  mode: "date" | "time" | "datetime";
  /** 当前值 */
  value: Date;
  /** 确认回调 */
  onConfirm: (date: Date) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 标题 */
  title?: string;
  /** 最小年份 */
  minYear?: number;
  /** 最大年份 */
  maxYear?: number;
  /** 分钟间隔 */
  minuteInterval?: number;
}

/**
 * 格式化时间为 HH:mm 字符串
 */
const formatTimeString = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * 解析时间字符串为小时和分钟
 */
const parseTimeString = (
  timeStr: string
): { hour: number; minute: number } => {
  const [hourStr, minuteStr] = timeStr.split(":");
  return {
    hour: parseInt(hourStr, 10) || 0,
    minute: parseInt(minuteStr, 10) || 0,
  };
};

/**
 * 获取默认标题
 */
const getDefaultTitle = (mode: "date" | "time" | "datetime"): string => {
  switch (mode) {
    case "date":
      return "选择日期";
    case "time":
      return "选择时间";
    case "datetime":
      return "选择日期和时间";
  }
};

/**
 * DateTimePickerModal 日期时间选择模态框组件
 */
export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  title,
  minYear,
  maxYear,
  minuteInterval = 1,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // 动画值
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // 内部状态 - 临时保存用户选择
  const [tempDate, setTempDate] = useState<Date>(value);
  const [tempTime, setTempTime] = useState<string>(formatTimeString(value));

  // 当 visible 或 value 变化时，重置临时状态
  useEffect(() => {
    if (visible) {
      // 打开时，使用传入的 value 初始化
      setTempDate(value);
      setTempTime(formatTimeString(value));
    }
  }, [visible, value]);

  // 处理显示/隐藏动画
  useEffect(() => {
    if (visible) {
      // 显示动画
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      // 隐藏动画
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [visible, backdropOpacity, translateY]);

  // 背景动画样式
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // 内容动画样式
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 处理日期变化
  const handleDateChange = useCallback((date: Date) => {
    setTempDate(date);
  }, []);

  // 处理时间变化
  const handleTimeChange = useCallback((time: string) => {
    setTempTime(time);
  }, []);

  // 处理确认
  const handleConfirm = useCallback(() => {
    let resultDate: Date;

    if (mode === "date") {
      // 仅日期模式：保留原始时间
      resultDate = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds()
      );
    } else if (mode === "time") {
      // 仅时间模式：保留原始日期
      const { hour, minute } = parseTimeString(tempTime);
      resultDate = new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        hour,
        minute,
        0
      );
    } else {
      // 日期时间模式：组合日期和时间
      const { hour, minute } = parseTimeString(tempTime);
      resultDate = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        hour,
        minute,
        0
      );
    }

    onConfirm(resultDate);
  }, [mode, tempDate, tempTime, value, onConfirm]);

  // 处理取消（包括点击背景）
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // 处理背景点击关闭
  const handleBackdropPress = useCallback(() => {
    // 先执行关闭动画，然后调用取消回调
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(handleCancel)();
    });
  }, [backdropOpacity, translateY, handleCancel]);

  // 显示标题
  const displayTitle = title || getDefaultTitle(mode);

  // 如果不可见，不渲染
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        {/* 半透明背景 */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleBackdropPress} />
        </Animated.View>

        {/* 底部弹出内容 */}
        <Animated.View
          style={[
            styles.contentContainer,
            contentAnimatedStyle,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* 头部：标题和按钮 */}
          <View
            style={[
              styles.header,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            {/* 取消按钮 */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                取消
              </Text>
            </TouchableOpacity>

            {/* 标题 */}
            <Text style={[styles.title, { color: colors.text }]}>
              {displayTitle}
            </Text>

            {/* 确认按钮 */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, { color: colors.primary }]}>
                确定
              </Text>
            </TouchableOpacity>
          </View>

          {/* 选择器内容区域 */}
          <View style={styles.pickerContainer}>
            {/* 日期选择器 */}
            {(mode === "date" || mode === "datetime") && (
              <View style={styles.pickerSection}>
                <DatePicker
                  value={tempDate}
                  onChange={handleDateChange}
                  minYear={minYear}
                  maxYear={maxYear}
                />
              </View>
            )}

            {/* 时间选择器 */}
            {(mode === "time" || mode === "datetime") && (
              <View style={styles.pickerSection}>
                <TimePicker
                  value={tempTime}
                  onChange={handleTimeChange}
                  minuteInterval={minuteInterval}
                />
              </View>
            )}
          </View>

          {/* 底部安全区域 */}
          <View style={styles.safeAreaBottom} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdropPressable: {
    flex: 1,
  },
  contentContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 60,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  pickerContainer: {
    paddingVertical: Spacing.lg,
  },
  pickerSection: {
    marginVertical: Spacing.sm,
  },
  safeAreaBottom: {
    height: 34, // iPhone X 及以上的底部安全区域
  },
});

export default DateTimePickerModal;
