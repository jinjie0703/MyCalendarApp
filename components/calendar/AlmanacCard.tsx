/**
 * 黄历卡片组件
 * 显示宜、忌、冲煞等黄历信息
 */

import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Shadows } from "@/constants/theme";
import { getAlmanacInfo } from "@/lib/almanac";

interface Props {
  date: string;
}

export function AlmanacCard({ date }: Props) {
  const info = getAlmanacInfo(date);

  if (!info) {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.errorText}>黄历获取失败</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="book.fill" size={16} color={Colors.light.primary} />
        <ThemedText style={styles.title}>黄历</ThemedText>
      </View>
      <View style={styles.content}>
        {/* 标题行 */}
        <ThemedText style={styles.dateTitle} numberOfLines={2}>
          {info.title} ({info.ganZhi})
        </ThemedText>

        {/* 宜 */}
        <ThemedText
          style={styles.yiLine}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          宜: {info.yi.join(" ")}
        </ThemedText>

        {/* 忌 */}
        <ThemedText
          style={styles.jiLine}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          忌: {info.ji.join(" ")}
        </ThemedText>

        {/* 冲煞 */}
        <ThemedText style={styles.chongShaLine}>
          冲煞: {info.chongSha}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  content: {
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  dateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  yiLine: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.success,
    fontWeight: "600",
  },
  jiLine: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.danger,
    fontWeight: "600",
  },
  chongShaLine: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5856D6",
    fontWeight: "500",
  },
});
