/**
 * 特殊提醒模块
 * 处理节日、节气、上班日提醒
 */

import { getLunar } from "chinese-lunar-calendar";
import dayjs from "dayjs";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { lunarFestivals, solarFestivals } from "./festivals";
import { loadSettings } from "./settings";

const isExpoGo = Constants.appOwnership === "expo";

// 提醒时间配置
const REMINDER_HOUR = 21; // 晚上9点
const SOLAR_TERM_HOUR = 9; // 节气当天早上9点

// 通知ID前缀
const FESTIVAL_NOTIFICATION_PREFIX = "festival-";
const SOLAR_TERM_NOTIFICATION_PREFIX = "solarterm-";
const WORKDAY_NOTIFICATION_PREFIX = "workday-";

/**
 * 获取未来N天内的节日
 */
function getUpcomingFestivals(days: number = 30): {
  date: string;
  name: string;
  reminderDate: string; // 提醒日期（前一天）
}[] {
  const festivals: { date: string; name: string; reminderDate: string }[] = [];
  const today = dayjs();

  for (let i = 0; i <= days; i++) {
    const date = today.add(i, "day");
    const month = date.month() + 1;
    const day = date.date();
    const dateStr = date.format("YYYY-MM-DD");

    // 检查公历节日
    const solarKey = `${month}-${day}`;
    if (solarFestivals[solarKey]) {
      const reminderDate = date.subtract(1, "day").format("YYYY-MM-DD");
      // 只添加提醒日期在今天或之后的节日
      if (dayjs(reminderDate).isSame(today, "day") || dayjs(reminderDate).isAfter(today)) {
        festivals.push({
          date: dateStr,
          name: solarFestivals[solarKey],
          reminderDate,
        });
      }
    }

    // 检查农历节日
    try {
      const lunar = getLunar(date.year(), month, day);
      const lunarMonth = (lunar as any).lunarMonth as number;
      const lunarDate = (lunar as any).lunarDate as number;
      const lunarKey = `${lunarMonth}-${lunarDate}`;
      
      if (lunarFestivals[lunarKey]) {
        const reminderDate = date.subtract(1, "day").format("YYYY-MM-DD");
        if (dayjs(reminderDate).isSame(today, "day") || dayjs(reminderDate).isAfter(today)) {
          festivals.push({
            date: dateStr,
            name: lunarFestivals[lunarKey],
            reminderDate,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return festivals;
}

/**
 * 获取未来N天内的节气
 */
function getUpcomingSolarTerms(days: number = 30): {
  date: string;
  name: string;
}[] {
  const terms: { date: string; name: string }[] = [];
  const today = dayjs();

  for (let i = 0; i <= days; i++) {
    const date = today.add(i, "day");
    const month = date.month() + 1;
    const day = date.date();

    try {
      const lunar = getLunar(date.year(), month, day);
      const solarTerm = (lunar as any).solarTerm;
      
      if (solarTerm) {
        terms.push({
          date: date.format("YYYY-MM-DD"),
          name: solarTerm,
        });
      }
    } catch {
      // ignore
    }
  }

  return terms;
}


/**
 * 获取未来N天内需要提醒的上班日
 * 周日晚上提醒"明天要上班"
 * 周五晚上提醒"明天是周六"
 */
function getUpcomingWorkdayReminders(days: number = 14): {
  date: string;
  type: "sunday" | "friday";
  message: string;
}[] {
  const reminders: { date: string; type: "sunday" | "friday"; message: string }[] = [];
  const today = dayjs();

  for (let i = 0; i <= days; i++) {
    const date = today.add(i, "day");
    const dayOfWeek = date.day(); // 0=周日, 5=周五

    if (dayOfWeek === 0) {
      // 周日
      reminders.push({
        date: date.format("YYYY-MM-DD"),
        type: "sunday",
        message: "明天要上班，早点休息吧 💪",
      });
    } else if (dayOfWeek === 5) {
      // 周五
      reminders.push({
        date: date.format("YYYY-MM-DD"),
        type: "friday",
        message: "明天是周六，好好放松吧 🎉",
      });
    }
  }

  return reminders;
}

/**
 * 安排节日提醒通知
 * 在节日前一天晚上9点提醒
 */
export async function scheduleFestivalReminders(): Promise<number> {
  if (isExpoGo) return 0;

  const settings = await loadSettings();
  if (!settings.festivalReminderEnabled) return 0;

  const festivals = getUpcomingFestivals(30);
  let count = 0;

  for (const festival of festivals) {
    const notificationId = `${FESTIVAL_NOTIFICATION_PREFIX}${festival.date}`;
    const reminderTime = dayjs(`${festival.reminderDate} ${REMINDER_HOUR}:00`, "YYYY-MM-DD HH:mm");

    // 如果提醒时间已过，跳过
    if (reminderTime.isBefore(dayjs())) continue;

    try {
      // 先取消已存在的通知
      await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎊 节日提醒",
          body: `明天是${festival.name}，记得准备哦！`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime.toDate(),
        },
        identifier: notificationId,
      });
      count++;
      console.log(`[SpecialReminder] 已安排节日提醒: ${festival.name} @ ${reminderTime.format("YYYY-MM-DD HH:mm")}`);
    } catch (e) {
      console.error(`[SpecialReminder] 安排节日提醒失败:`, e);
    }
  }

  return count;
}

/**
 * 安排节气提醒通知
 * 在节气当天早上9点提醒
 */
export async function scheduleSolarTermReminders(): Promise<number> {
  if (isExpoGo) return 0;

  const settings = await loadSettings();
  if (!settings.solarTermReminderEnabled) return 0;

  const terms = getUpcomingSolarTerms(30);
  let count = 0;

  for (const term of terms) {
    const notificationId = `${SOLAR_TERM_NOTIFICATION_PREFIX}${term.date}`;
    const reminderTime = dayjs(`${term.date} ${SOLAR_TERM_HOUR}:00`, "YYYY-MM-DD HH:mm");

    // 如果提醒时间已过，跳过
    if (reminderTime.isBefore(dayjs())) continue;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌿 节气提醒",
          body: `今天是${term.name}，注意养生哦！`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime.toDate(),
        },
        identifier: notificationId,
      });
      count++;
      console.log(`[SpecialReminder] 已安排节气提醒: ${term.name} @ ${reminderTime.format("YYYY-MM-DD HH:mm")}`);
    } catch (e) {
      console.error(`[SpecialReminder] 安排节气提醒失败:`, e);
    }
  }

  return count;
}


/**
 * 安排上班日提醒通知
 * 周日晚上9点提醒"明天要上班"
 * 周五晚上9点提醒"明天是周六"
 */
export async function scheduleWorkdayReminders(): Promise<number> {
  if (isExpoGo) return 0;

  const settings = await loadSettings();
  if (!settings.workdayReminderEnabled) return 0;

  const reminders = getUpcomingWorkdayReminders(14);
  let count = 0;

  for (const reminder of reminders) {
    const notificationId = `${WORKDAY_NOTIFICATION_PREFIX}${reminder.date}-${reminder.type}`;
    const reminderTime = dayjs(`${reminder.date} ${REMINDER_HOUR}:00`, "YYYY-MM-DD HH:mm");

    // 如果提醒时间已过，跳过
    if (reminderTime.isBefore(dayjs())) continue;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

      const title = reminder.type === "sunday" ? "📅 上班提醒" : "🎉 周末提醒";

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: reminder.message,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime.toDate(),
        },
        identifier: notificationId,
      });
      count++;
      console.log(`[SpecialReminder] 已安排上班日提醒: ${reminder.type} @ ${reminderTime.format("YYYY-MM-DD HH:mm")}`);
    } catch (e) {
      console.error(`[SpecialReminder] 安排上班日提醒失败:`, e);
    }
  }

  return count;
}

/**
 * 取消所有特殊提醒
 */
export async function cancelAllSpecialReminders(): Promise<void> {
  if (isExpoGo) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduled) {
      const id = notification.identifier;
      if (
        id.startsWith(FESTIVAL_NOTIFICATION_PREFIX) ||
        id.startsWith(SOLAR_TERM_NOTIFICATION_PREFIX) ||
        id.startsWith(WORKDAY_NOTIFICATION_PREFIX)
      ) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    console.log("[SpecialReminder] 已取消所有特殊提醒");
  } catch (e) {
    console.error("[SpecialReminder] 取消特殊提醒失败:", e);
  }
}

/**
 * 安排所有特殊提醒（应用启动时调用）
 */
export async function scheduleAllSpecialReminders(): Promise<void> {
  if (isExpoGo) {
    console.log("[SpecialReminder] 在 Expo Go 中运行，跳过特殊提醒安排");
    return;
  }

  console.log("[SpecialReminder] 开始安排特殊提醒...");

  const [festivalCount, solarTermCount, workdayCount] = await Promise.all([
    scheduleFestivalReminders(),
    scheduleSolarTermReminders(),
    scheduleWorkdayReminders(),
  ]);

  console.log(`[SpecialReminder] 已安排特殊提醒: 节日=${festivalCount}, 节气=${solarTermCount}, 上班日=${workdayCount}`);
}

/**
 * 根据设置更新特殊提醒
 * 当设置变化时调用
 */
export async function updateSpecialReminders(): Promise<void> {
  await cancelAllSpecialReminders();
  await scheduleAllSpecialReminders();
}
