/**
 * 月视图组件
 * 包含日历网格和农历显示
 * 支持滑动切换月份
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, PanResponder, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";

import { CalendarDay } from "./CalendarDay";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 50;

interface Props {
  selectedDate: string;
  calendarKey?: number;
  onDayPress: (dateString: string) => void;
  enableAnimation?: boolean;
  animationDuration?: number;
}

// 获取上个月的日期字符串
function getPreviousMonth(dateString: string): string {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
}

// 获取下个月的日期字符串
function getNextMonth(dateString: string): string {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}

export function MonthView({ 
  selectedDate, 
  calendarKey, 
  onDayPress,
  enableAnimation = true,
  animationDuration = 250,
}: Props) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [isAnimating, setIsAnimating] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  
  const currentDateRef = useRef(currentDate);
  const isAnimatingRef = useRef(isAnimating);
  
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);
  
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // 执行月份切换动画
  const animateToMonth = useCallback((newDate: string) => {
    if (isAnimatingRef.current) return;
    
    if (!enableAnimation) {
      setCurrentDate(newDate);
      onDayPress(newDate);
      return;
    }

    setIsAnimating(true);

    // 淡出
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: animationDuration / 2,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // 切换日期
      setCurrentDate(newDate);
      onDayPress(newDate);
      
      // 淡入
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationDuration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  }, [enableAnimation, animationDuration, fadeAnim, onDayPress]);
  
  const animateToMonthRef = useRef(animateToMonth);
  useEffect(() => {
    animateToMonthRef.current = animateToMonth;
  }, [animateToMonth]);

  // 手势处理
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimatingRef.current) return;
        
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          const nextMonth = getNextMonth(currentDateRef.current);
          animateToMonthRef.current(nextMonth);
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          const prevMonth = getPreviousMonth(currentDateRef.current);
          animateToMonthRef.current(prevMonth);
        }
      },
    }),
    []
  );

  // 当 selectedDate 变化时（从外部改变）
  useEffect(() => {
    const newMonth = selectedDate.substring(0, 7);
    const currentMonth = currentDate.substring(0, 7);
    
    if (newMonth !== currentMonth && !isAnimating) {
      animateToMonth(selectedDate);
    } else if (newMonth === currentMonth && currentDate !== selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate, currentDate, isAnimating, animateToMonth]);

  // 构建 markedDates
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    marked[selectedDate] = {
      selected: true,
      selectedColor: "#A1CEDC",
    };
    return marked;
  }, [selectedDate]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View 
        style={[
          styles.calendarContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Calendar
          key={currentDate}
          current={currentDate}
          onDayPress={(d) => onDayPress(d.dateString)}
          markedDates={markedDates}
          enableSwipeMonths={false}
          dayComponent={({ date: dayDate, state }: any) => {
            const dateString = dayDate?.dateString;
            if (!dateString) return null;

            return (
              <CalendarDay
                date={dayDate}
                state={state}
                isSelected={dateString === selectedDate}
                onPress={onDayPress}
              />
            );
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
  },
});
