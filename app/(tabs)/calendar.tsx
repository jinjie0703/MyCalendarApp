import { ActionMenu } from "@/components/action-menu";
import { CalendarHeader } from "@/components/calendar-header";
import { DayView } from "@/components/day-view";
import { WeekView } from "@/components/week-view";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import isoWeek from "dayjs/plugin/isoWeek";
import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { Calendar } from "react-native-calendars";

import { getLunar } from "chinese-lunar-calendar";
import { Solar } from "lunar-javascript";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";

import {
  CalendarEvent,
  deleteEvent,
  getEventsByDate,
  getEventsByDateRange,
  initDatabase,
} from "@/lib/database";

dayjs.extend(isoWeek);
dayjs.locale("zh-cn");

export type ViewMode = "month" | "week" | "day";

export default function CalendarScreen() {
  const today = dayjs().format("YYYY-MM-DD");

  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [calendarKey, setCalendarKey] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const router = useRouter();

  useEffect(() => {
    initDatabase()
      .then(setDb)
      .catch((err) => {
        console.error(err);
        Alert.alert("DB 初始化失败", String(err));
      });
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);

  const [showAlmanac, setShowAlmanac] = useState(true);

  const solarFestivals: Record<string, string> = {
    "1-1": "元旦",
    "2-14": "情人节",
    "3-8": "妇女节",
    "5-1": "劳动节",
    "6-1": "儿童节",
    "10-1": "国庆节",
    "12-25": "圣诞节",
  };
  // lunarMonth and lunarDate are numbers without leading zero
  const lunarFestivals: Record<string, string> = {
    "1-1": "春节",
    "1-15": "元宵节",
    "5-5": "端午节",
    "7-7": "七夕",
    "8-15": "中秋节",
    "9-9": "重阳节",
  };

  const getLunarDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const lunar = getLunar(date.getFullYear(), month, day);
      const lunarMonth = (lunar as any).lunarMonth as number;
      const lunarDate = (lunar as any).lunarDate as number;

      const solarKey = `${month}-${day}`;
      const lunarKey = `${lunarMonth}-${lunarDate}`;

      const festivalLabel =
        lunarFestivals[lunarKey] || solarFestivals[solarKey] || null;

      return {
        lunarDay: String((lunar as any).dateStr || "").replace(/^.+月/, ""),
        lunarMonth: String(lunarMonth),
        isTerm: (lunar as any).solarTerm || null,
        isFestival: festivalLabel,
      };
    } catch (e) {
      return { lunarDay: "", lunarMonth: "", isTerm: null, isFestival: null };
    }
  };

  const getAlmanacInfo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const solar = Solar.fromYmd(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      const lunar = solar.getLunar();

      // 标题行：农历冬月初三（乙巳蛇年 戊子月 乙丑日）
      const title = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}  (${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日)`;

      const yi = lunar.getDayYi();
      const ji = lunar.getDayJi();

      // 和你截图类似：宜/忌后面列出条目
      const yiLine = `宜: ${yi.join(" ")}`;
      const jiLine = `忌: ${ji.join(" ")}`;

      // 可选补充：冲煞
      const chongShaLine = `冲煞: 冲${lunar.getChongDesc()} 煞${lunar.getSha()}`;

      return [title, yiLine, jiLine, chongShaLine].join("\n");
    } catch (e) {
      return "黄历获取失败";
    }
  };

  const markedDates = useMemo(() => {
    const marked: any = {};
    const today = dayjs();
    const currentMonth = dayjs(selectedDate).startOf("month");

    // 标记选中的日期
    marked[selectedDate] = {
      selected: true,
      selectedColor: "#A1CEDC",
    };

    // 为当前月份的所有日期添加农历信息
    for (let i = 1; i <= currentMonth.daysInMonth(); i++) {
      const date = currentMonth.date(i).format("YYYY-MM-DD");
      const lunarInfo = getLunarDate(date);

      marked[date] = {
        ...marked[date],
        customStyles: {
          container: {
            justifyContent: "flex-start",
            alignItems: "center",
          },
          text: {
            color: "black",
            marginTop: 0,
          },
        },
        // 添加农历日期
        lunarDay: lunarInfo.lunarDay,
        // 添加节日或节气
        marking: lunarInfo.isFestival || lunarInfo.isTerm || undefined,
        dot: lunarInfo.isFestival || lunarInfo.isTerm,
        dotColor: lunarInfo.isFestival ? "#FF6B6B" : "#4ECDC4",
      };

      // 节假日：先用 lunar lib 自带的 solarFestival/lunarFestival 展示
      // 如需法定节假日调休（国务院口径），后续可接入后端或换成 RN 兼容的节假日数据源
    }

    return marked;
  }, [selectedDate]);

  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleMorePress = (anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (anchor) setMoreAnchor(anchor);
    setMoreMenuVisible(true);
  };

  const refresh = async (date: string) => {
    if (!db) return;
    const list = await getEventsByDate(db, date);
    setEvents(list);
  };

  // 获取周视图的事件
  const refreshWeekEvents = async (date: string) => {
    if (!db) return;
    const current = dayjs(date);
    const monday = current.isoWeekday(1).format("YYYY-MM-DD");
    const sunday = current.isoWeekday(7).format("YYYY-MM-DD");
    const list = await getEventsByDateRange(db, monday, sunday);
    setWeekEvents(list);
  };

  useEffect(() => {
    refresh(selectedDate).catch(console.error);
    if (viewMode === "week") {
      refreshWeekEvents(selectedDate).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, selectedDate, viewMode]);

  // 当页面重新获得焦点（从编辑页返回）时刷新
  useFocusEffect(
    useCallback(() => {
      refresh(selectedDate).catch(console.error);
    }, [selectedDate, db])
  );

  const onDelete = async (id: string) => {
    if (!db) return;
    await deleteEvent(db, id);
    await refresh(selectedDate);
  };

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          <CalendarHeader
            selectedDate={selectedDate}
            onPressAdd={() =>
              router.push({
                pathname: "/event/edit",
                params: { date: selectedDate },
              })
            }
            onPressToday={() => {
              setViewMode("month");
              setSelectedDate(today);
              // 强制 Calendar 重新挂载，确保跳转到对应月份（部分版本 current 更新不会自动翻页）
              setCalendarKey((k) => k + 1);
            }}
            onPressSearch={() => router.push("/search")}
            onPressMore={handleMorePress}
          />

          <ActionMenu
            visible={moreMenuVisible}
            onRequestClose={() => setMoreMenuVisible(false)}
            anchor={moreAnchor}
            items={[
              {
                key: "month",
                label: "月视图",
                onPress: () => setViewMode("month"),
              },
              {
                key: "week",
                label: "周视图",
                onPress: () => setViewMode("week"),
              },
              {
                key: "day",
                label: "日视图",
                onPress: () => setViewMode("day"),
              },
              {
                key: "year",
                label: "年视图",
                onPress: () =>
                  router.push({
                    pathname: "/year",
                    params: { date: selectedDate },
                  }),
              },
              {
                key: "settings",
                label: "设置",
                onPress: () => router.push("/settings"),
              },
            ]}
          />

          {/* 视图切换标签 */}
          <View style={styles.viewModeTabs}>
            {(["month", "week", "day"] as const).map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.viewModeTab,
                  viewMode === mode && styles.viewModeTabActive,
                ]}
                onPress={() => setViewMode(mode)}
              >
                <ThemedText
                  style={[
                    styles.viewModeTabText,
                    viewMode === mode && styles.viewModeTabTextActive,
                  ]}
                >
                  {mode === "month" ? "月" : mode === "week" ? "周" : "日"}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {viewMode === "month" && (
            <Calendar
              key={calendarKey}
              current={selectedDate}
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={markedDates}
              enableSwipeMonths
              dayComponent={({ date, state, marking }: any) => {
                const dateString = date?.dateString;
                const lunarInfo = dateString ? getLunarDate(dateString) : null;
                const isSelected = dateString === selectedDate;
                // 显示优先级：节日 >= 节气 > 农历日期
                const festivalLabel = lunarInfo?.isFestival;
                const termLabel = lunarInfo?.isTerm;
                const lunarLabel = lunarInfo?.lunarDay;
                const subLabel = festivalLabel || termLabel || lunarLabel || "";

                return (
                  <Pressable
                    onPress={() => dateString && setSelectedDate(dateString)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 4,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: isSelected ? "#A1CEDC" : "transparent",
                      minWidth: 36,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected ? "700" : "500",
                        color:
                          state === "disabled" ? "rgba(0,0,0,0.35)" : "#111",
                        lineHeight: 18,
                      }}
                    >
                      {date?.day}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        opacity: festivalLabel || termLabel ? 1 : 0.75,
                        color: festivalLabel
                          ? "#C0392B"
                          : termLabel
                          ? "#0E7C86"
                          : "rgba(0,0,0,0.7)",
                        lineHeight: 12,
                      }}
                      numberOfLines={1}
                    >
                      {subLabel}
                    </ThemedText>
                  </Pressable>
                );
              }}
            />
          )}

          {/* 周视图 */}
          {viewMode === "week" && (
            <WeekView
              selectedDate={selectedDate}
              events={weekEvents}
              onDayPress={(date) => setSelectedDate(date)}
              onEventPress={(event) =>
                router.push({
                  pathname: "/event/edit",
                  params: { id: event.id, date: event.date },
                })
              }
            />
          )}

          {/* 日视图 */}
          {viewMode === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={events}
              onEventPress={(event) =>
                router.push({
                  pathname: "/event/edit",
                  params: { id: event.id, date: event.date },
                })
              }
            />
          )}

          {/* 年视图已迁移为独立页面 /year，这里不再渲染 */}

          {/* 黄历卡片 */}
          {showAlmanac && viewMode === "month" && (
            <ThemedView style={styles.almanacCard}>
              <View style={styles.almanacHeader}>
                <IconSymbol
                  name="book.fill"
                  size={16}
                  color={Colors.light.primary}
                />
                <ThemedText style={styles.almanacTitle}>黄历</ThemedText>
              </View>
              <View style={styles.almanacContent}>
                {(() => {
                  const lines = getAlmanacInfo(selectedDate).split("\n");
                  return lines.map((line, idx) => {
                    const isTitle = idx === 0;
                    const isYi = line.startsWith("宜:");
                    const isJi = line.startsWith("忌:");
                    const isChongSha = line.startsWith("冲煞:");
                    return (
                      <ThemedText
                        key={`${idx}-${line}`}
                        style={[
                          styles.almanacLine,
                          isTitle && styles.almanacLineTitle,
                          isYi && styles.almanacLineYi,
                          isJi && styles.almanacLineJi,
                          isChongSha && styles.almanacLineChongSha,
                        ]}
                        numberOfLines={isTitle ? 2 : 1}
                        ellipsizeMode="tail"
                      >
                        {line}
                      </ThemedText>
                    );
                  });
                })()}
              </View>
            </ThemedView>
          )}

          {/* 事件列表 */}
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {dayjs(selectedDate).format("M月D日")} 日程
              </ThemedText>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/event/edit",
                    params: { date: selectedDate },
                  })
                }
                style={styles.addEventBtn}
              >
                <IconSymbol
                  name="plus"
                  size={14}
                  color={Colors.light.primary}
                />
                <ThemedText style={styles.addEventText}>添加</ThemedText>
              </Pressable>
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyEvents}>
                <IconSymbol
                  name="calendar.badge.plus"
                  size={40}
                  color={Colors.light.textTertiary}
                />
                <ThemedText style={styles.emptyText}>暂无日程安排</ThemedText>
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/event/edit",
                      params: { date: selectedDate },
                    })
                  }
                >
                  <ThemedText style={styles.emptyBtnText}>
                    创建新日程
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.eventList}>
                {events.map((e) => (
                  <Pressable
                    key={e.id}
                    style={({ pressed }) => [
                      styles.eventItem,
                      pressed && styles.eventItemPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/event/edit",
                        params: { id: e.id, date: e.date },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.eventColorBar,
                        { backgroundColor: e.color || Colors.light.primary },
                      ]}
                    />
                    <View style={styles.eventContent}>
                      <ThemedText style={styles.eventTitle}>
                        {e.title}
                      </ThemedText>
                      {e.time && (
                        <View style={styles.eventTimeRow}>
                          <IconSymbol
                            name="clock"
                            size={12}
                            color={Colors.light.textSecondary}
                          />
                          <ThemedText style={styles.eventTime}>
                            {e.time}
                          </ThemedText>
                        </View>
                      )}
                      {e.description && (
                        <ThemedText style={styles.eventDesc} numberOfLines={1}>
                          {e.description}
                        </ThemedText>
                      )}
                    </View>
                    <Pressable
                      onPress={(ev) => {
                        ev.stopPropagation();
                        Alert.alert("删除事件", `确定删除"${e.title}"吗？`, [
                          { text: "取消", style: "cancel" },
                          {
                            text: "删除",
                            style: "destructive",
                            onPress: () => onDelete(e.id),
                          },
                        ]);
                      }}
                      hitSlop={10}
                      style={styles.deleteBtn}
                    >
                      <IconSymbol
                        name="trash"
                        size={18}
                        color={Colors.light.danger}
                      />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </ThemedView>

          {/* 底部留白给浮动按钮 */}
          <View style={{ height: 80 }} />
        </ThemedView>
      </ScrollView>

      {/* 浮动添加按钮 */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() =>
          router.push({
            pathname: "/event/edit",
            params: { date: selectedDate },
          })
        }
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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

  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  addEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addEventText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },

  // 空状态
  emptyEvents: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // 事件列表
  eventList: {
    gap: 8,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 12,
    ...Shadows.sm,
  },
  eventItemPressed: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  eventColorBar: {
    width: 4,
    height: "100%",
    minHeight: 40,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  eventTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventTime: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  deleteBtn: {
    padding: 8,
  },

  // 黄历卡片
  almanacCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Shadows.sm,
  },
  almanacHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  almanacTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  almanacContent: {
    gap: 6,
  },
  almanacLine: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  almanacLineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  almanacLineYi: {
    color: Colors.light.success,
    fontWeight: "600",
  },
  almanacLineJi: {
    color: Colors.light.danger,
    fontWeight: "600",
  },
  almanacLineChongSha: {
    color: "#5856D6",
    fontWeight: "500",
  },

  // 视图切换
  viewModeTabs: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: 8,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  viewModeTabActive: {
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  viewModeTabText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  viewModeTabTextActive: {
    color: Colors.light.text,
    fontWeight: "600",
  },

  // 根容器
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // 浮动添加按钮
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.25,
  },
});
