import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { SettingsItem } from "@/components/settings-item";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useSettings } from "@/hooks/useSettings";
import { deleteEvent, getAllEvents, getDb, initDatabase } from "@/lib/database";
import { importEventsFromICS, shareICSFile } from "@/lib/ical";
import {
  CalendarViewMode,
  calendarViewOptions,
  DefaultReminder,
  FirstDayOfWeek,
  getReminderLabel,
  getTimezoneLabel,
  reminderOptions,
  RingtoneOption,
  ringtoneOptions,
  timezoneOptions,
} from "@/lib/settings";

// 选择器 Modal 组件
function PickerModal<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons
                name="close"
                size={24}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  value === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(option.value);
                  onClose();
                }}
              >
                <ThemedText
                  style={[
                    styles.modalOptionText,
                    value === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </ThemedText>
                {value === option.value && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={Colors.light.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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

  // Modal 状态
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [ringtoneModalVisible, setRingtoneModalVisible] = useState(false);
  const [viewModeModalVisible, setViewModeModalVisible] = useState(false);



  // 处理每周起始日切换
  const handleFirstDayChange = useCallback(() => {
    const options = [
      { text: "周一", value: "monday" as FirstDayOfWeek },
      { text: "周日", value: "sunday" as FirstDayOfWeek },
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "选择每周起始日",
          options: [...options.map((o) => o.text), "取消"],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index < options.length) {
            Haptics.selectionAsync();
            updateSettings({ firstDayOfWeek: options[index].value });
          }
        }
      );
    } else {
      Alert.alert("每周起始日", "请选择", [
        ...options.map((o) => ({
          text: o.text,
          onPress: () => {
            Haptics.selectionAsync();
            updateSettings({ firstDayOfWeek: o.value });
          },
        })),
        { text: "取消", style: "cancel" },
      ]);
    }
  }, [updateSettings]);

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
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const db = getDb();
        await initDatabase();
        const events = await getAllEvents(db);
        setEventCount(events.length);
      } catch {
        setEventCount(0);
      }
    };
    loadStats();
  }, []);

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: Colors.light.primary, dark: "#1a1a2e" }}
      >
        <ThemedView style={styles.container}>
          {/* 外观 */}

          {/* 通用 */}
          <Section title="通用" icon="cog-outline">
            <Card>
              <SettingsItem
                title="时区"
                description="影响日程显示与提醒触发时间"
                rightLabel={getTimezoneLabel(settings.timezone)}
                onPress={() => setTimezoneModalVisible(true)}
              />
              <Divider />
              <SettingsItem
                title="每周起始日"
                description="周视图/年视图的周排列顺序"
                rightLabel={
                  settings.firstDayOfWeek === "monday" ? "周一" : "周日"
                }
                onPress={handleFirstDayChange}
              />
              <Divider />
              <SettingsItem
                title="默认日历视图"
                description="打开日历时默认显示的视图"
                rightLabel={
                  calendarViewOptions.find(
                    (o) => o.value === settings.defaultCalendarView
                  )?.label || "月视图"
                }
                onPress={() => setViewModeModalVisible(true)}
              />
            </Card>
          </Section>

          {/* 提醒 */}
          <Section title="提醒" icon="notifications-outline">
            <Card>
              <SettingsItem
                title="默认提醒方式"
                description="新建事件时默认的提醒策略"
                rightLabel={getReminderLabel(settings.defaultReminder)}
                onPress={() => setReminderModalVisible(true)}
              />
              <Divider />
              <SettingsItem
                title="铃声"
                description="事件提醒的提示音"
                rightLabel={
                  ringtoneOptions.find((o) => o.value === settings.ringtone)
                    ?.label || "默认"
                }
                onPress={() => setRingtoneModalVisible(true)}
              />
              <Divider />
              <SettingsItem
                title="振动"
                description="提醒时振动手机"
                type="switch"
                value={settings.vibrationEnabled}
                onValueChange={(v) => updateSettings({ vibrationEnabled: v })}
              />
            </Card>
          </Section>

          {/* 节日与节气 */}
          <Section title="节日与节气" icon="sunny-outline">
            <Card>
              <SettingsItem
                title="节日提醒"
                description="对传统/公历节日进行提醒"
                type="switch"
                value={settings.festivalReminderEnabled}
                onValueChange={(v) =>
                  updateSettings({ festivalReminderEnabled: v })
                }
              />
              <Divider />
              <SettingsItem
                title="节气提醒"
                description="二十四节气提醒"
                type="switch"
                value={settings.solarTermReminderEnabled}
                onValueChange={(v) =>
                  updateSettings({ solarTermReminderEnabled: v })
                }
              />
              <Divider />
              <SettingsItem
                title="法定节假日提醒"
                description="包含放假/调休信息"
                type="switch"
                value={settings.holidayReminderEnabled}
                onValueChange={(v) =>
                  updateSettings({ holidayReminderEnabled: v })
                }
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

      {/* 时区选择 Modal */}
      <PickerModal
        visible={timezoneModalVisible}
        title="选择时区"
        options={timezoneOptions}
        value={settings.timezone}
        onSelect={(v) => updateSettings({ timezone: v })}
        onClose={() => setTimezoneModalVisible(false)}
      />

      {/* 提醒方式选择 Modal */}
      <PickerModal
        visible={reminderModalVisible}
        title="默认提醒方式"
        options={reminderOptions}
        value={settings.defaultReminder}
        onSelect={(v) =>
          updateSettings({ defaultReminder: v as DefaultReminder })
        }
        onClose={() => setReminderModalVisible(false)}
      />

      {/* 铃声选择 Modal */}
      <PickerModal
        visible={ringtoneModalVisible}
        title="选择铃声"
        options={ringtoneOptions}
        value={settings.ringtone}
        onSelect={(v) => updateSettings({ ringtone: v as RingtoneOption })}
        onClose={() => setRingtoneModalVisible(false)}
      />

      {/* 日历视图选择 Modal */}
      <PickerModal
        visible={viewModeModalVisible}
        title="默认日历视图"
        options={calendarViewOptions}
        value={settings.defaultCalendarView}
        onSelect={(v) =>
          updateSettings({ defaultCalendarView: v as CalendarViewMode })
        }
        onClose={() => setViewModeModalVisible(false)}
      />
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
  // Modal 样式
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.borderLight,
  },
  modalOptionSelected: {
    backgroundColor: Colors.light.surfaceSecondary,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
