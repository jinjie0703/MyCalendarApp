import dayjs from "dayjs";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { CalendarEvent, getAllEvents, getDb } from "./database";

// 检测是否在 Expo Go 中运行
const isExpoGo = Constants.appOwnership === "expo";

// 配置通知行为（本地通知，不需要推送令牌）
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// 请求通知权限（仅本地通知，不请求推送令牌）
export async function requestNotificationPermission(): Promise<boolean> {
  // 在 Expo Go 中跳过通知功能
  if (isExpoGo) {
    console.log("在 Expo Go 中运行，通知功能已禁用");
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("通知权限被拒绝");
      return false;
    }

    // Android 需要设置通知渠道
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("calendar-reminders", {
        name: "日历提醒",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A90D9",
        sound: "default",
      });
    }

    return true;
  } catch (error) {
    console.warn("通知权限请求失败:", error);
    return false;
  }
}

// 获取事件的通知标识符
function getNotificationId(eventId: string): string {
  return `event-${eventId}`;
}

// 为单个事件安排通知
export async function scheduleEventNotification(
  event: CalendarEvent
): Promise<string | null> {
  // 在 Expo Go 中跳过
  if (isExpoGo) {
    return null;
  }

  // 如果没有设置提醒或设置为不提醒(-1)，不安排通知
  if (event.remindOffsetMin === undefined || event.remindOffsetMin < 0) {
    return null;
  }

  // 计算通知时间
  const eventDateTime = event.time
    ? dayjs(`${event.date} ${event.time}`, "YYYY-MM-DD HH:mm")
    : dayjs(event.date, "YYYY-MM-DD").startOf("day").add(9, "hour"); // 如果没有时间，默认早上9点

  const notifyTime = eventDateTime.subtract(event.remindOffsetMin, "minute");

  // 如果通知时间已过，不安排
  if (notifyTime.isBefore(dayjs())) {
    return null;
  }

  // 先取消之前的通知（如果有）
  await cancelEventNotification(event.id);

  // 构建通知标题
  let title = "日程提醒";
  switch (event.type) {
    case "reminder":
      title = "⏰ 提醒";
      break;
    case "schedule":
      title = "📅 日程";
      break;
    case "course":
      title = "📚 课程";
      break;
    case "countdown":
      title = "⏳ 倒数日";
      break;
    case "birthday":
      title = "🎂 生日";
      break;
    case "anniversary":
      title = "💕 纪念日";
      break;
  }

  // 构建通知内容
  let body = event.title;
  if (event.time) {
    body = `${event.time} - ${event.title}`;
  }
  if (event.remindOffsetMin > 0) {
    body += `\n(提前${event.remindOffsetMin}分钟提醒)`;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { eventId: event.id, date: event.date },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyTime.toDate(),
      },
      identifier: getNotificationId(event.id),
    });

    console.log(
      `已安排通知: ${event.title} @ ${notifyTime.format("YYYY-MM-DD HH:mm")}`
    );
    return identifier;
  } catch (e) {
    console.error("安排通知失败:", e);
    return null;
  }
}

// 取消单个事件的通知
export async function cancelEventNotification(eventId: string): Promise<void> {
  if (isExpoGo) {
    return;
  }
  
  try {
    await Notifications.cancelScheduledNotificationAsync(
      getNotificationId(eventId)
    );
  } catch {
    // 忽略取消不存在的通知的错误
  }
}

// 取消所有通知
export async function cancelAllNotifications(): Promise<void> {
  if (isExpoGo) {
    return;
  }
  
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// 获取所有已安排的通知
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  if (isExpoGo) {
    return [];
  }
  
  return await Notifications.getAllScheduledNotificationsAsync();
}

// 为所有未来事件安排通知（应用启动时调用）
export async function scheduleAllEventNotifications(): Promise<void> {
  if (isExpoGo) {
    console.log("在 Expo Go 中运行，跳过通知安排");
    return;
  }

  try {
    const db = getDb();
    const events = await getAllEvents(db);
    const today = dayjs().format("YYYY-MM-DD");

    // 只为今天及以后的事件安排通知
    const futureEvents = events.filter((e) => e.date >= today);

    // 先取消所有现有通知，重新安排
    await cancelAllNotifications();

    let scheduledCount = 0;
    for (const event of futureEvents) {
      const result = await scheduleEventNotification(event);
      if (result) scheduledCount++;
    }

    console.log(`已安排 ${scheduledCount} 个通知`);
  } catch (error) {
    console.error("安排所有通知失败:", error);
  }
}

// 处理重复事件的通知
export async function scheduleRepeatingNotification(
  event: CalendarEvent,
  count: number = 10 // 默认为接下来10次重复安排通知
): Promise<void> {
  if (isExpoGo) {
    return;
  }

  if (!event.repeatRule || event.repeatRule === "none") {
    await scheduleEventNotification(event);
    return;
  }

  const baseDate = dayjs(event.date);

  for (let i = 0; i < count; i++) {
    let nextDate: dayjs.Dayjs;

    switch (event.repeatRule) {
      case "daily":
        nextDate = baseDate.add(i, "day");
        break;
      case "weekly":
        nextDate = baseDate.add(i, "week");
        break;
      case "monthly":
        nextDate = baseDate.add(i, "month");
        break;
      case "yearly":
        nextDate = baseDate.add(i, "year");
        break;
      default:
        continue;
    }

    // 创建临时事件对象用于安排通知
    const tempEvent: CalendarEvent = {
      ...event,
      id: `${event.id}-repeat-${i}`,
      date: nextDate.format("YYYY-MM-DD"),
    };

    await scheduleEventNotification(tempEvent);
  }
}

// 添加通知点击监听器
export function addNotificationResponseListener(
  callback: (eventId: string, date: string) => void
): Notifications.EventSubscription | null {
  if (isExpoGo) {
    return null;
  }

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.eventId) {
      callback(data.eventId as string, data.date as string);
    }
  });
}

// 添加通知接收监听器
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription | null {
  if (isExpoGo) {
    return null;
  }

  return Notifications.addNotificationReceivedListener(callback);
}
