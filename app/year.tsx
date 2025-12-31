import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function MonthCalendar({
  year,
  month,
  today,
  selectedDate,
  onDayPress,
}: {
  year: number;
  month: number;
  today: dayjs.Dayjs;
  selectedDate: string;
  onDayPress: (date: string) => void;
}) {
  const monthName = `${month}月`;
  const firstDay = dayjs(`${year}-${month}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const startDayOfWeek = firstDay.day() === 0 ? 6 : firstDay.day() - 1; // 0 (Mon) - 6 (Sun)

  const days = [
    ...Array.from({ length: startDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.monthContainer}>
      <ThemedText style={styles.monthTitle}>{monthName}</ThemedText>
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <ThemedText key={day} style={styles.weekdayText}>
            {day}
          </ThemedText>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          const dateString = `${year}-${String(month).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          const isToday = dateString === today.format("YYYY-MM-DD");
          const isSelected = dateString === selectedDate;

          return (
            <Pressable
              key={day}
              style={styles.dayCell}
              onPress={() => onDayPress(dateString)}
            >
              <View
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  isToday && styles.todayButton,
                ]}
              >
                <ThemedText
                  style={[styles.dayText, isToday && styles.todayText]}
                >
                  {day}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function YearScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const initialDate = dayjs(params.date || undefined);

  const [year, setYear] = useState(initialDate.year());
  const today = dayjs();

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const handleDayPress = (date: string) => {
    // 返回到主日历页面，并带上选中的日期
    if (router.canGoBack()) {
      router.back();
      // Note: We can't pass params back directly. The main screen needs to be updated.
      // We will modify the main screen to listen for changes.
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => setYear(year - 1)} style={styles.navButton}>
          <IconSymbol name="chevron.left" size={22} color="#666" />
        </Pressable>
        <ThemedText style={styles.yearTitle}>{year}</ThemedText>
        <Pressable onPress={() => setYear(year + 1)} style={styles.navButton}>
          <IconSymbol name="chevron.right" size={22} color="#666" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {months.map((month) => (
          <MonthCalendar
            key={month}
            year={year}
            month={month}
            today={today}
            selectedDate={initialDate.format("YYYY-MM-DD")}
            onDayPress={handleDayPress}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingTop: 50, // For status bar
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  navButton: {
    padding: 8,
  },
  scrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 8,
  },
  monthContainer: {
    width: "31%",
    marginVertical: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  weekdayText: {
    fontSize: 11,
    color: "#888",
    width: "14.28%",
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButton: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  dayButtonSelected: {
    backgroundColor: "#A1CEDC",
  },
  todayButton: {
    borderWidth: 1,
    borderColor: "#A1CEDC",
  },
  dayText: {
    fontSize: 12,
  },
  todayText: {
    fontWeight: "bold",
    color: "#0E7C86",
  },
});
