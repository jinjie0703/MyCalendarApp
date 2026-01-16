import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  View
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { SettingsItem } from "@/components/settings-item";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useSettings } from "@/hooks/useSettings";
import { deleteEvent, getAllEvents, getDb, initDatabase } from "@/lib/database";
import { importEventsFromICS, shareICSFile } from "@/lib/ical";
import { updateSpecialReminders } from "@/lib/special-reminders";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    updateSettings,
    resetSettings: resetAllSettings,
  } = useSettings();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // 导出事件
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const success = await shareICSFile();
      if (!success) {
        Alert.alert("提示", "没有可导出的事件或导出失败");
      }
    } catch (error) {
      Alert.alert("导出失败", String(error));
    } finally {
      setIsExporting(false);
    }
  };

  // 导入事件
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importEventsFromICS();
      Alert.alert(result.success ? "导入成功" : "导入失败", result.message);
      if (result.success) {
        await refreshEventCount();
      }
    } catch (error) {
      Alert.alert("导入失败", String(error));
    } finally {
      setIsImporting(false);
    }
  };

  // 清除所有事件
  const handleClearAllEvents = useCallback(() => {
    Alert.alert(
      "清除所有事件",
      "此操作将删除所有日历事件，且无法恢复。确定要继续吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "清除",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const db = getDb();
              await initDatabase();
              const events = await getAllEvents(db);
              for (const event of events) {
                await deleteEvent(db, event.id);
              }
              setEventCount(0);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("完成", `已清除 ${events.length} 个事件`);
            } catch (error) {
              Alert.alert("清除失败", String(error));
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  }, []);

  // 重置设置
  const handleResetSettings = useCallback(() => {
    Alert.alert("重置设置", "将所有设置恢复为默认值，确定要继续吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "重置",
        style: "destructive",
        onPress: async () => {
          await resetAllSettings();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("完成", "设置已重置为默认值");
        },
      },
    ]);
  }, [resetAllSettings]);



  // 统计信息
  const [eventCount, setEventCount] = useState<number | null>(null);
  
  const refreshEventCount = useCallback(async () => {
    try {
      const db = getDb();
      await initDatabase();
      const events = await getAllEvents(db);
      setEventCount(events.length);
    } catch {
      setEventCount(0);
    }
  }, []);

  React.useEffect(() => {
    refreshEventCount();
  }, [refreshEventCount]);

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: Colors.light.primary, dark: "#1a1a2e" }}
      >
        <ThemedView style={styles.container}>
          {/* 节日与节气 */}
          <Section title="节日与节气" icon="sunny-outline">
            <Card>
              <SettingsItem
                title="节日提醒"
                description="节日前一天晚上9点提醒"
                type="switch"
                value={settings.festivalReminderEnabled}
                onValueChange={(v) => {
                  updateSettings({ festivalReminderEnabled: v });
                  updateSpecialReminders();
                }}
              />
              <Divider />
              <SettingsItem
                title="节气提醒"
                description="节气当天早上9点提醒"
                type="switch"
                value={settings.solarTermReminderEnabled}
                onValueChange={(v) => {
                  updateSettings({ solarTermReminderEnabled: v });
                  updateSpecialReminders();
                }}
              />
              <Divider />
              <SettingsItem
                title="上班日提醒"
                description="周日/周五晚上9点提醒"
                type="switch"
                value={settings.workdayReminderEnabled}
                onValueChange={(v) => {
                  updateSettings({ workdayReminderEnabled: v });
                  updateSpecialReminders();
                }}
              />
            </Card>
          </Section>

          {/* 数据管理 */}
          <Section title="数据管理" icon="folder-outline">
            <Card>
              <SettingsItem
                title="导出日历"
                description="将所有事件导出为 iCal (.ics) 文件"
                rightLabel={
                  isExporting ? "导出中..." : `${eventCount ?? 0} 个事件`
                }
                onPress={handleExport}
              />
              <Divider />
              <SettingsItem
                title="导入日历"
                description="从 iCal (.ics) 文件导入事件"
                rightLabel={isImporting ? "导入中..." : ""}
                onPress={handleImport}
              />
              <Divider />
              <SettingsItem
                title="清除所有事件"
                description="删除所有日历事件（不可恢复）"
                rightLabel={isClearing ? "清除中..." : ""}
                onPress={handleClearAllEvents}
                destructive
              />
            </Card>
          </Section>

          {/* 订阅 */}
          <Section title="日历订阅" icon="globe-outline">
            <Card>
              <SettingsItem
                title="管理订阅"
                description="订阅网络日历（支持 iCal URL）"
                onPress={() => router.push("/subscriptions")}
                showArrow
              />
            </Card>
          </Section>

          {/* 其他 */}
          <Section title="其他" icon="ellipsis-horizontal-outline">
            <Card>
              <SettingsItem
                title="重置所有设置"
                description="将所有设置恢复为默认值"
                onPress={handleResetSettings}
                destructive
              />
            </Card>
          </Section>
        </ThemedView>
      </ParallaxScrollView>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={Colors.light.primary}
            style={styles.sectionIcon}
          />
        )}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </View>
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
    gap: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 4,
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginHorizontal: 16,
  },
});
