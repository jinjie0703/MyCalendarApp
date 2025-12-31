/**
 * 日期选择管理 Hook
 */

import dayjs from "dayjs";
import { useCallback, useState } from "react";

export function useDateSelection(initialDate?: string) {
  const today = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || today
  );
  const [calendarKey, setCalendarKey] = useState(0);

  // 跳转到今天
  const goToToday = useCallback(() => {
    setSelectedDate(today);
    // 强制 Calendar 重新挂载，确保跳转到对应月份
    setCalendarKey((k) => k + 1);
  }, [today]);

  // 选择日期
  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // 跳转到指定月份
  const goToMonth = useCallback((date: string) => {
    setSelectedDate(date);
    setCalendarKey((k) => k + 1);
  }, []);

  return {
    today,
    selectedDate,
    calendarKey,
    selectDate,
    goToToday,
    goToMonth,
  };
}
