import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { SettingsItem } from "@/components/settings-item";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type SettingsState = {
  ringtone: string;
  timezone: string;
  firstDayOfWeek: "周一" | "周日";
  defaultReminder: string;
  holidayReminderEnabled: boolean;
  solarTermReminderEnabled: boolean;
  festivalReminderEnabled: boolean;
};

export default function SettingsScreen() {
  const deviceTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "自动";
    } catch {
      return "自动";
    }
  }, []);

  // 先做“视图/框架”，暂不做持久化与真实能力
  const [s, setS] = useState<SettingsState>({
    ringtone: "默认",
    timezone: deviceTimezone,
    firstDayOfWeek: "周一",
    defaultReminder: "提前 15 分钟",
    holidayReminderEnabled: true,
    solarTermReminderEnabled: true,
    festivalReminderEnabled: true,
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#EFEFEF", dark: "#222" }}
      headerImage={<ThemedView />}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">设置</ThemedText>
        <ThemedText style={styles.hint}>
          这里先实现设置页的视图框架：后续可接入 API/本地存储/系统权限。
        </ThemedText>

        {/* 通用 */}
        <Section title="通用">
          <Card>
            <SettingsItem
              title="时区"
              description="影响日程显示与提醒触发时间"
              rightLabel={s.timezone}
              onPress={() =>
                Alert.alert(
                  "待实现",
                  "后续可做：自动/手动选择时区列表（或跟随系统）"
                )
              }
            />
            <Divider />
            <SettingsItem
              title="每周起始日"
              description="周视图/年视图的周排列顺序"
              rightLabel={s.firstDayOfWeek}
              onPress={() =>
                Alert.alert("每周起始日", "请选择", [
                  {
                    text: "周一",
                    onPress: () =>
                      setS((p) => ({ ...p, firstDayOfWeek: "周一" })),
                  },
                  {
                    text: "周日",
                    onPress: () =>
                      setS((p) => ({ ...p, firstDayOfWeek: "周日" })),
                  },
                  { text: "取消", style: "cancel" },
                ])
              }
            />
          </Card>
        </Section>

        {/* 提醒 */}
        <Section title="提醒">
          <Card>
            <SettingsItem
              title="默认提醒方式"
              description="新建事件时默认的提醒策略"
              rightLabel={s.defaultReminder}
              onPress={() =>
                Alert.alert("默认提醒方式", "请选择", [
                  {
                    text: "不提醒",
                    onPress: () =>
                      setS((p) => ({ ...p, defaultReminder: "不提醒" })),
                  },
                  {
                    text: "提前 5 分钟",
                    onPress: () =>
                      setS((p) => ({ ...p, defaultReminder: "提前 5 分钟" })),
                  },
                  {
                    text: "提前 15 分钟",
                    onPress: () =>
                      setS((p) => ({ ...p, defaultReminder: "提前 15 分钟" })),
                  },
                  {
                    text: "提前 1 小时",
                    onPress: () =>
                      setS((p) => ({ ...p, defaultReminder: "提前 1 小时" })),
                  },
                  { text: "取消", style: "cancel" },
                ])
              }
            />
            <Divider />
            <SettingsItem
              title="铃声"
              description="事件提醒的提示音"
              rightLabel={s.ringtone}
              onPress={() =>
                Alert.alert(
                  "待实现",
                  "后续可做：系统铃声选择（iOS/Android 方式不同），或内置音效列表"
                )
              }
            />
          </Card>
        </Section>

        {/* 节日与节气 */}
        <Section title="节日与节气">
          <Card>
            <SettingsItem
              title="节日提醒"
              description="对传统/公历节日进行提醒（需要节日数据源）"
              type="switch"
              value={s.festivalReminderEnabled}
              onValueChange={(v) =>
                setS((p) => ({ ...p, festivalReminderEnabled: v }))
              }
            />
            <Divider />
            <SettingsItem
              title="节气提醒"
              description="二十四节气提醒"
              type="switch"
              value={s.solarTermReminderEnabled}
              onValueChange={(v) =>
                setS((p) => ({ ...p, solarTermReminderEnabled: v }))
              }
            />
            <Divider />
            <SettingsItem
              title="法定节假日提醒"
              description="包含放假/调休（需要联网或每年更新数据）"
              type="switch"
              value={s.holidayReminderEnabled}
              onValueChange={(v) =>
                setS((p) => ({ ...p, holidayReminderEnabled: v }))
              }
            />
          </Card>
        </Section>

        {/* 占位：后续 */}
        <Section title="高级（待实现）">
          <Card>
            <SettingsItem
              title="默认日历源"
              description="选择本地/云端/订阅日历"
              rightLabel="未选择"
              onPress={() => Alert.alert("待实现", "后续可做：日历源管理")}
            />
            <Divider />
            <SettingsItem
              title="备份与同步"
              description="导入/导出/云同步"
              rightLabel="未开启"
              onPress={() =>
                Alert.alert("待实现", "后续可做：iCloud/Google/本地备份")
              }
            />
          </Card>
        </Section>
      </ThemedView>
    </ParallaxScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <ThemedView style={styles.card}>{children}</ThemedView>;
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 12,
  },
  hint: {
    opacity: 0.75,
    lineHeight: 18,
  },
  section: {
    gap: 10,
    marginTop: 6,
  },
  sectionTitle: {
    opacity: 0.75,
  },
  card: {
    borderRadius: 16,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 10,
  },
});
