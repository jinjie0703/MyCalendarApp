import AsyncStorage from "@react-native-async-storage/async-storage";

// 设置项键名
const SETTINGS_KEY = "app_settings";

// 每周起始日类型
export type FirstDayOfWeek = "monday" | "sunday";

// 主题模式
export type ThemeMode = "system" | "light" | "dark";

// 默认提醒选项
export type DefaultReminder =
  | "none"
  | "at_time"
  | "5min"
  | "10min"
  | "15min"
  | "30min"
  | "1hour"
  | "1day";

// 日历视图模式
export type CalendarViewMode = "month" | "week" | "day";

// 铃声选项
export type RingtoneOption = "default" | "gentle" | "urgent" | "silent";

// 设置状态接口
export interface AppSettings {
  // 通用设置
  timezone: string;
  firstDayOfWeek: FirstDayOfWeek;
  themeMode: ThemeMode;
  defaultCalendarView: CalendarViewMode;

  // 提醒设置
  defaultReminder: DefaultReminder;
  ringtone: RingtoneOption;
  vibrationEnabled: boolean;

  // 节日与节气
  showLunarCalendar: boolean;
  holidayReminderEnabled: boolean;
  solarTermReminderEnabled: boolean;
  festivalReminderEnabled: boolean;

  // 显示设置
  showWeekNumbers: boolean;
  compactMode: boolean;

  // 隐私与数据
  dataBackupEnabled: boolean;
  lastBackupDate?: string;
}

// 默认设置
export const defaultSettings: AppSettings = {
  // 通用
  timezone: "auto",
  firstDayOfWeek: "monday",
  themeMode: "system",
  defaultCalendarView: "month",

  // 提醒
  defaultReminder: "15min",
  ringtone: "default",
  vibrationEnabled: true,

  // 节日与节气
  showLunarCalendar: true,
  holidayReminderEnabled: true,
  solarTermReminderEnabled: true,
  festivalReminderEnabled: true,

  // 显示
  showWeekNumbers: false,
  compactMode: false,

  // 隐私与数据
  dataBackupEnabled: false,
};

// 提醒选项映射
export const reminderOptions: {
  value: DefaultReminder;
  label: string;
  minutes: number;
}[] = [
  { value: "none", label: "不提醒", minutes: -1 },
  { value: "at_time", label: "事件发生时", minutes: 0 },
  { value: "5min", label: "提前 5 分钟", minutes: 5 },
  { value: "10min", label: "提前 10 分钟", minutes: 10 },
  { value: "15min", label: "提前 15 分钟", minutes: 15 },
  { value: "30min", label: "提前 30 分钟", minutes: 30 },
  { value: "1hour", label: "提前 1 小时", minutes: 60 },
  { value: "1day", label: "提前 1 天", minutes: 1440 },
];

// 铃声选项映射
export const ringtoneOptions: { value: RingtoneOption; label: string }[] = [
  { value: "default", label: "默认" },
  { value: "gentle", label: "柔和" },
  { value: "urgent", label: "急促" },
  { value: "silent", label: "静音" },
];

// 主题选项映射
export const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色模式" },
  { value: "dark", label: "深色模式" },
];

// 日历视图选项
export const calendarViewOptions: { value: CalendarViewMode; label: string }[] =
  [
    { value: "month", label: "月视图" },
    { value: "week", label: "周视图" },
    { value: "day", label: "日视图" },
  ];

// 常用时区列表
export const timezoneOptions: { value: string; label: string }[] = [
  { value: "auto", label: "自动（跟随系统）" },
  { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "香港时间 (UTC+8)" },
  { value: "Asia/Taipei", label: "台北时间 (UTC+8)" },
  { value: "Asia/Tokyo", label: "东京时间 (UTC+9)" },
  { value: "Asia/Seoul", label: "首尔时间 (UTC+9)" },
  { value: "Asia/Singapore", label: "新加坡时间 (UTC+8)" },
  { value: "America/New_York", label: "美国东部时间 (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "美国太平洋时间 (UTC-8/-7)" },
  { value: "Europe/London", label: "伦敦时间 (UTC+0/+1)" },
  { value: "Europe/Paris", label: "巴黎时间 (UTC+1/+2)" },
  { value: "Australia/Sydney", label: "悉尼时间 (UTC+10/+11)" },
];

// 保存设置
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("保存设置失败:", error);
    throw error;
  }
}

// 加载设置
export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并默认设置，确保新增的设置项有默认值
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  } catch (error) {
    console.error("加载设置失败:", error);
    return defaultSettings;
  }
}

// 更新部分设置
export async function updateSettings(
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...patch };
  await saveSettings(updated);
  return updated;
}

// 重置设置为默认
export async function resetSettings(): Promise<AppSettings> {
  await saveSettings(defaultSettings);
  return defaultSettings;
}

// 获取提醒时间（分钟）
export function getReminderMinutes(reminder: DefaultReminder): number {
  const option = reminderOptions.find((o) => o.value === reminder);
  return option?.minutes ?? 15;
}

// 获取提醒显示文本
export function getReminderLabel(reminder: DefaultReminder): string {
  const option = reminderOptions.find((o) => o.value === reminder);
  return option?.label ?? "提前 15 分钟";
}

// 获取时区显示文本
export function getTimezoneLabel(timezone: string): string {
  if (timezone === "auto") {
    try {
      const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return `自动 (${systemTz})`;
    } catch {
      return "自动";
    }
  }
  const option = timezoneOptions.find((o) => o.value === timezone);
  return option?.label ?? timezone;
}

// 获取实际使用的时区
export function getEffectiveTimezone(timezone: string): string {
  if (timezone === "auto") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Asia/Shanghai";
    }
  }
  return timezone;
}
