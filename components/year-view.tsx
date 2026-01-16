import { ThemedText } from "@/components/themed-text";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from "react-native";

type YearViewProps = {
  /** 当前选中的日期，格式 YYYY-MM-DD */
  currentDate: string;
  /** 点击日期回调 */
  onSelectDate?: (date: string) => void;
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
] as const;

// 获取屏幕宽度来决定布局
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_TABLET = SCREEN_WIDTH >= 768;

export function YearView({ currentDate, onSelectDate }: YearViewProps) {
  const currentDayjs = dayjs(currentDate);
  const currentYear = currentDayjs.year();
  const today = dayjs();
  const isCurrentYear = currentYear === today.year();

  // 生成12个月的日历数据
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const firstDay = dayjs(`${currentYear}-${month}-01`);
      const daysInMonth = firstDay.daysInMonth();
      const firstDayOfWeek = firstDay.day();
      
      // 生成当月的日期数组
      const days = [];
      // 上个月的日期（用于填充第一周）
      const prevMonthDays = firstDayOfWeek;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? currentYear - 1 : currentYear;
      const daysInPrevMonth = dayjs(`${prevYear}-${prevMonth}-01`).daysInMonth();
      
      // 下个月的日期（用于填充最后一周）
      const lastDayOfMonth = dayjs(`${currentYear}-${month}-${daysInMonth}`);
      const lastDayOfWeek = lastDayOfMonth.day();
      const nextMonthDays = 6 - lastDayOfWeek;
      
      // 上个月的最后几天
      for (let i = 0; i < prevMonthDays; i++) {
        const day = daysInPrevMonth - prevMonthDays + i + 1;
        days.push({
          day,
          month: prevMonth,
          year: prevYear,
          isCurrentMonth: false,
          isToday: false,
          date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      // 当月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentYear && month === today.month() + 1 && day === today.date();
        days.push({
          day,
          month,
          year: currentYear,
          isCurrentMonth: true,
          isToday,
          date: `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      // 下个月的前几天
      for (let i = 0; i < nextMonthDays; i++) {
        const day = i + 1;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? currentYear + 1 : currentYear;
        days.push({
          day,
          month: nextMonth,
          year: nextYear,
          isCurrentMonth: false,
          isToday: false,
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
      
      // 确保每个月都有6行（42天）
      while (days.length < 42) {
        const lastDate: dayjs.Dayjs = dayjs(days[days.length - 1].date);
        const nextDate: dayjs.Dayjs = lastDate.add(1, 'day');
        days.push({
          day: nextDate.date(),
          month: nextDate.month() + 1,
          year: nextDate.year(),
          isCurrentMonth: false,
          isToday: false,
          date: nextDate.format('YYYY-MM-DD')
        });
      }
      
      return {
        month,
        monthName: MONTH_NAMES[month - 1],
        year: currentYear,
        days,
        isCurrentMonth: month === currentDayjs.month() + 1
      };
    });
  }, [currentYear, isCurrentYear, currentDayjs, today]);

  const handleDayPress = (date: string) => {
    onSelectDate?.(date);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.yearHeader}>
        <ThemedText type="title" style={styles.yearText}>
          {currentYear}年
        </ThemedText>
      </View>
      
      <View style={styles.monthsContainer}>
        {months.map((monthData) => (
          <View 
            key={`${monthData.year}-${monthData.month}`} 
            style={[
              styles.monthContainer,
              monthData.isCurrentMonth && styles.currentMonthContainer
            ]}
          >
            <ThemedText 
              type="subtitle" 
              style={[
                styles.monthTitle,
                monthData.isCurrentMonth && styles.currentMonthTitle
              ]}
            >
              {monthData.monthName}
            </ThemedText>
            
            {/* 星期行 */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <ThemedText style={styles.weekdayText}>
                    {day}
                  </ThemedText>
                </View>
              ))}
            </View>
            
            {/* 日期格子 */}
            <View style={styles.daysGrid}>
              {monthData.days.map((day, index) => {
                const isSelected = day.date === currentDate;
                const isCurrentMonth = day.isCurrentMonth;
                
                return (
                  <View 
                    key={`${day.year}-${day.month}-${day.day}-${index}`}
                    style={styles.dayCell}
                  >
                    <Pressable
                      onPress={() => handleDayPress(day.date)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        pressed && styles.dayButtonPressed,
                        isSelected && styles.dayButtonSelected,
                        day.isToday && styles.todayButton,
                        !isCurrentMonth && styles.otherMonthDay
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          !isCurrentMonth && styles.otherMonthDayText,
                          day.isToday && styles.todayText,
                          (day.day === 1 || index === 0) && styles.firstDayOfMonth
                        ]}
                      >
                        {day.day}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  yearHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 24,
    fontWeight: '700',
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthContainer: {
    width: IS_TABLET ? '24%' : '32%', // 平板4列，手机3列
    marginBottom: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  currentMonthContainer: {
    backgroundColor: 'rgba(161, 206, 220, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.5)',
  },
  monthTitle: {
    textAlign: 'center',
    marginBottom: 4,
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '600',
  },
  currentMonthTitle: {
    color: '#0E7C86',
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: IS_TABLET ? 10 : 8,
    opacity: 0.6,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  dayButton: {
    width: IS_TABLET ? 20 : 16,
    height: IS_TABLET ? 20 : 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dayButtonSelected: {
    backgroundColor: '#A1CEDC',
  },
  todayButton: {
    borderWidth: 1,
    borderColor: '#A1CEDC',
  },
  dayText: {
    fontSize: IS_TABLET ? 10 : 8,
    textAlign: 'center',
  },
  selectedDayText: {
    color: '#000',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#0E7C86',
    fontWeight: '600',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthDayText: {
    opacity: 0.4,
  },
  firstDayOfMonth: {
    fontWeight: '600',
  },
});
