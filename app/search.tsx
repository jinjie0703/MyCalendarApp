import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import dayjs from "dayjs";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";
import { CalendarEvent, getAllEvents, getDb } from "@/lib/database";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [results, setResults] = useState<CalendarEvent[]>([]);

  // 加载所有事件
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const db = getDb();
        const events = await getAllEvents(db);
        setAllEvents(events);
      } catch (err) {
        console.error("加载事件失败:", err);
      }
    };
    loadEvents();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.date.includes(q)
    );

    // 按日期排序，最近的在前
    filtered.sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      return dateB.diff(dateA);
    });

    setResults(filtered);
  }, [query, allEvents]);

  const renderEvent = useCallback(
    ({ item }: { item: CalendarEvent }) => {
      const d = dayjs(item.date);
      const isPast = d.isBefore(dayjs().startOf("day"));

      return (
        <Pressable
          style={({ pressed }) => [
            styles.eventItem,
            pressed && styles.eventItemPressed,
          ]}
          onPress={() =>
            router.push({
              pathname: "/event/edit",
              params: { id: item.id, date: item.date },
            })
          }
        >
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color || Colors.light.primary },
            ]}
          />
          <View style={styles.eventContent}>
            <ThemedText
              style={[styles.eventTitle, isPast && styles.pastEventTitle]}
              numberOfLines={1}
            >
              {item.title}
            </ThemedText>
            <View style={styles.eventMeta}>
              <ThemedText style={styles.eventDate}>
                {d.format("M月D日 dddd")}
              </ThemedText>
              {item.time && (
                <ThemedText style={styles.eventTime}>{item.time}</ThemedText>
              )}
            </View>
            {item.description && (
              <ThemedText style={styles.eventDesc} numberOfLines={1}>
                {item.description}
              </ThemedText>
            )}
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors.light.textTertiary}
          />
        </Pressable>
      );
    },
    [router]
  );

  return (
    <ThemedView style={styles.container}>
      {/* 搜索头部 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={Colors.light.primary}
          />
        </Pressable>
        <View style={styles.searchBox}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={Colors.light.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索事件..."
            placeholderTextColor={Colors.light.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
              <IconSymbol
                name="xmark.circle.fill"
                size={18}
                color={Colors.light.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* 搜索结果 */}
      {query.trim() === "" ? (
        <View style={styles.emptyState}>
          <IconSymbol
            name="magnifyingglass"
            size={48}
            color={Colors.light.textTertiary}
          />
          <ThemedText style={styles.emptyText}>输入关键词搜索事件</ThemedText>
          <ThemedText style={styles.emptyHint}>
            支持搜索标题、描述、日期
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            name="doc.text.magnifyingglass"
            size={48}
            color={Colors.light.textTertiary}
          />
          <ThemedText style={styles.emptyText}>没有找到相关事件</ThemedText>
          <ThemedText style={styles.emptyHint}>尝试其他关键词</ThemedText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <ThemedText style={styles.resultCount}>
              找到 {results.length} 个结果
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
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
  colorIndicator: {
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
  pastEventTitle: {
    color: Colors.light.textSecondary,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  eventTime: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
});
