/**
 * 日历事件管理 Hook
 * 封装事件的增删改查操作
 */

import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  CalendarEvent,
  deleteEvent,
  getEventsByDate,
  getEventsByDateRange,
  initDatabase,
} from "@/lib/database";
import { cancelEventNotification } from "@/lib/notifications";

dayjs.extend(isoWeek);

export function useCalendarEvents(selectedDate: string) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 初始化数据库
  useEffect(() => {
    initDatabase()
      .then(setDb)
      .catch((err) => {
        console.error(err);
        Alert.alert("DB 初始化失败", String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  // 刷新当天事件
  const refreshDayEvents = useCallback(
    async (date: string) => {
      if (!db) return;
      try {
        const list = await getEventsByDate(db, date);
        setEvents(list);
      } catch (err) {
        console.error("获取事件失败:", err);
      }
    },
    [db]
  );

  // 刷新一周事件
  const refreshWeekEvents = useCallback(
    async (date: string) => {
      if (!db) return;
      try {
        const current = dayjs(date);
        const monday = current.isoWeekday(1).format("YYYY-MM-DD");
        const sunday = current.isoWeekday(7).format("YYYY-MM-DD");
        const list = await getEventsByDateRange(db, monday, sunday);
        setWeekEvents(list);
      } catch (err) {
        console.error("获取周事件失败:", err);
      }
    },
    [db]
  );

  // 删除事件
  const removeEvent = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        // 先取消通知
        await cancelEventNotification(id);
        // 再删除事件
        await deleteEvent(db, id);
        await refreshDayEvents(selectedDate);
      } catch (err) {
        console.error("删除事件失败:", err);
        Alert.alert("删除失败", String(err));
      }
    },
    [db, selectedDate, refreshDayEvents]
  );

  // 当数据库或日期变化时刷新
  useEffect(() => {
    if (db) {
      refreshDayEvents(selectedDate);
    }
  }, [db, selectedDate, refreshDayEvents]);

  return {
    db,
    events,
    weekEvents,
    loading,
    refreshDayEvents,
    refreshWeekEvents,
    removeEvent,
  };
}
