/**
 * 日历主页面
 * 重构后的精简版本，使用模块化组件和 Hooks
 */

import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import { ActionMenu } from "@/components/action-menu";
import { CalendarHeader } from "@/components/calendar-header";
import { DayView } from "@/components/day-view";
import { ThemedView } from "@/components/themed-view";
import { WeekView } from "@/components/week-view";

// 新的模块化组件
import { AlmanacCard, MonthView, ViewModeTabs } from "@/components/calendar";
import { EventSection, FloatingAddButton } from "@/components/events";

// 自定义 Hooks
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useDateSelection } from "@/hooks/useDateSelection";
import { useViewMode } from "@/hooks/useViewMode";

import { Colors } from "@/constants/theme";

export default function CalendarScreen() {
  const router = useRouter();

  // 使用自定义 Hooks 管理状态
  const { today, selectedDate, calendarKey, selectDate, goToToday } =
    useDateSelection();
  const { viewMode, setViewMode } = useViewMode("month");
  const {
    events,
    weekEvents,
    refreshDayEvents,
    refreshWeekEvents,
    removeEvent,
  } = useCalendarEvents(selectedDate);

  // 更多菜单状态
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 周视图事件刷新
  useEffect(() => {
    if (viewMode === "week") {
      refreshWeekEvents(selectedDate);
    }
  }, [viewMode, selectedDate, refreshWeekEvents]);

  // 页面获得焦点时刷新（从编辑页返回）
  useFocusEffect(
    useCallback(() => {
      refreshDayEvents(selectedDate);
    }, [selectedDate, refreshDayEvents])
  );

  // 导航到事件编辑页
  const navigateToEventEdit = useCallback(
    (eventId?: string, date?: string) => {
      router.push({
        pathname: "/event/edit",
        params: eventId
          ? { id: eventId, date: date || selectedDate }
          : { date: selectedDate },
      });
    },
    [router, selectedDate]
  );

  // 处理更多菜单
  const handleMorePress = (anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (anchor) setMoreAnchor(anchor);
    setMoreMenuVisible(true);
  };

  // 更多菜单选项
  const menuItems = [
    { key: "month", label: "月视图", onPress: () => setViewMode("month") },
    { key: "week", label: "周视图", onPress: () => setViewMode("week") },
    { key: "day", label: "日视图", onPress: () => setViewMode("day") },
    {
      key: "year",
      label: "年视图",
      onPress: () =>
        router.push({ pathname: "/year", params: { date: selectedDate } }),
    },
    { key: "settings", label: "设置", onPress: () => router.push("/settings") },
  ];

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          {/* 头部 */}
          <CalendarHeader
            selectedDate={selectedDate}
            onPressToday={() => {
              setViewMode("month");
              goToToday();
            }}
            onPressSearch={() => router.push("/search")}
            onPressMore={handleMorePress}
          />

          {/* 更多菜单 */}
          <ActionMenu
            visible={moreMenuVisible}
            onRequestClose={() => setMoreMenuVisible(false)}
            anchor={moreAnchor}
            items={menuItems}
          />

          {/* 视图切换标签 */}
          <ViewModeTabs viewMode={viewMode} onChange={setViewMode} />

          {/* 月视图 */}
          {viewMode === "month" && (
            <MonthView
              selectedDate={selectedDate}
              calendarKey={calendarKey}
              onDayPress={selectDate}
            />
          )}

          {/* 周视图 */}
          {viewMode === "week" && (
            <WeekView
              selectedDate={selectedDate}
              events={weekEvents}
              onDayPress={selectDate}
              onEventPress={(event) =>
                navigateToEventEdit(event.id, event.date)
              }
            />
          )}

          {/* 日视图 */}
          {viewMode === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={events}
              onEventPress={(event) =>
                navigateToEventEdit(event.id, event.date)
              }
            />
          )}

          {/* 黄历卡片（仅月视图显示） */}
          {viewMode === "month" && <AlmanacCard date={selectedDate} />}

          {/* 事件列表 */}
          <EventSection
            selectedDate={selectedDate}
            events={events}
            onAddEvent={() => navigateToEventEdit()}
            onEventPress={(event) => navigateToEventEdit(event.id, event.date)}
            onEventDelete={removeEvent}
          />

          {/* 底部留白 */}
          <View style={{ height: 80 }} />
        </ThemedView>
      </ScrollView>

      {/* 浮动添加按钮 */}
      <FloatingAddButton onPress={() => navigateToEventEdit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
});
