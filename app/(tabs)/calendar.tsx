import { CalendarHeader } from "@/components/calendar-header";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { Calendar } from "react-native-calendars";

import { getLunar } from "chinese-lunar-calendar";
import { Solar } from "lunar-javascript";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import {
  CalendarEvent,
  deleteEvent,
  getEventsByDate,
  initDatabase,
} from "@/lib/database";

export default function CalendarScreen() {
  const today = dayjs().format("YYYY-MM-DD");

  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
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

  const [viewMode, setViewMode] = useState<"month" | "year" | "agenda">(
    "month"
  );
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

  const handleMorePress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["取消", "年视图", "纵览", "设置", "显示/隐藏黄历"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              setViewMode("year");
              break;
            case 2:
              setViewMode("agenda");
              break;
            case 3:
              // 设置页面待实现
              Alert.alert("提示", "设置页面待实现");
              break;
            case 4:
              setShowAlmanac(!showAlmanac);
              break;
          }
        }
      );
    } else {
      // Android 可以使用其他方式实现
      Alert.alert(
        "更多选项",
        "",
        [
          { text: "年视图", onPress: () => setViewMode("year") },
          { text: "纵览", onPress: () => setViewMode("agenda") },
          {
            text: "设置",
            onPress: () => Alert.alert("提示", "设置页面待实现"),
          },
          {
            text: showAlmanac ? "隐藏黄历" : "显示黄历",
            onPress: () => setShowAlmanac(!showAlmanac),
          },
          { text: "取消", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  const refresh = async (date: string) => {
    if (!db) return;
    const list = await getEventsByDate(db, date);
    setEvents(list);
  };

  useEffect(() => {
    refresh(selectedDate).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, selectedDate]);

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
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<ThemedView />}
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
          onPressToday={() => setSelectedDate(today)}
          onPressMore={handleMorePress}
        />

        {viewMode === "month" && (
          <Calendar
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
                      color: state === "disabled" ? "rgba(0,0,0,0.35)" : "#111",
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

        {viewMode === "year" && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">年视图（待完善）</ThemedText>
            <ThemedText style={styles.hint}>
              这里先做占位：后续可以做 12 个月缩略日历。
            </ThemedText>
          </ThemedView>
        )}

        {viewMode === "agenda" && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">纵览（待完善）</ThemedText>
            <ThemedText style={styles.hint}>
              这里先做占位：后续可以做按时间轴/按周的汇总列表。
            </ThemedText>
          </ThemedView>
        )}

        {showAlmanac && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">{selectedDate} 黄历</ThemedText>
            <ThemedText style={styles.almanacText}>
              {getAlmanacInfo(selectedDate)}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">{selectedDate} 事件</ThemedText>

          {events.length === 0 ? (
            <ThemedText style={styles.hint}>当天暂无事件</ThemedText>
          ) : (
            events.map((e) => (
              <ThemedView key={e.id} style={styles.eventItem}>
                <ThemedText type="defaultSemiBold">
                  {e.time ? `${e.time}  ` : ""}
                  {e.title}
                </ThemedText>
                <Pressable onPress={() => onDelete(e.id)}>
                  <ThemedText style={styles.deleteText}>删除</ThemedText>
                </Pressable>
              </ThemedView>
            ))
          )}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  section: {
    gap: 10,
    marginTop: 8,
  },
  hint: {
    opacity: 0.7,
  },
  eventItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  deleteText: {
    color: "#C0392B",
  },
  almanacText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(161,206,220,0.15)",
  },
});
