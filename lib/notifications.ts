import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import {
  CalendarEvent,
  getAllEvents,
  getDb,
  getEventById,
  getEventsByDate
} from "./database";

// 检测是否在 Expo Go 中运行
const isExpoGo = Constants.appOwnership === "expo";

const REMINDER_CATEGORY_ID = "calendar-reminder-actions";
const STOP_REMINDING_ACTION_ID = "STOP_REMINDING";

const DEFAULT_NAG_INTERVAL_MS = 5000; // 5秒提醒一次
const DEFAULT_DUE_WATCH_INTERVAL_MS = 5000;
const DEFAULT_ALARM_MAX_DURATION_MIN = 5; // 闹钟类型最多提醒5分钟

const STOP_KEY_PREFIX = "stop-reminding:";

type ActiveNag = {
  timer: ReturnType<typeof setInterval>;
  sending: boolean;
  endAt: number; // epoch ms
};

let notificationCategoriesInitialized = false;
const activeNags = new Map<string, ActiveNag>();
const stoppedOccurrences = new Set<string>();

let dueWatcherTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let currentAppState = AppState.currentState;

function getOccurrenceKey(eventId: string, date: string): string {
  return `${eventId}:${date}`;
}

async function ensureNotificationCategoriesInitialized(): Promise<void> {
  if (isExpoGo || notificationCategoriesInitialized) return;

  try {
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: STOP_REMINDING_ACTION_ID,
        buttonTitle: "不再提醒",
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);
    notificationCategoriesInitialized = true;
    console.log("[Notification] 通知分类初始化成功");
  } catch (e) {
    console.warn("初始化通知动作失败:", e);
  }
}

function buildEventDateTime(event: CalendarEvent): dayjs.Dayjs {
  return event.time
    ? dayjs(`${event.date} ${event.time}`, "YYYY-MM-DD HH:mm")
    : dayjs(event.date, "YYYY-MM-DD").startOf("day").add(9, "hour");
}

function buildNotifyTime(event: CalendarEvent): dayjs.Dayjs {
  const offset = event.remindOffsetMin ?? 0;
  return buildEventDateTime(event).subtract(offset, "minute");
}

function buildNotificationTitle(event: CalendarEvent): string {
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
  return title;
}

function buildNotificationBody(event: CalendarEvent): string {
  let body = event.title;
  if (event.time) {
    body = `${event.time} - ${event.title}`;
  }
  if ((event.remindOffsetMin ?? 0) > 0) {
    body += `\n(提前${event.remindOffsetMin}分钟提醒)`;
  }
  return body;
}

async function isOccurrenceStopped(occurrenceKey: string): Promise<boolean> {
  if (stoppedOccurrences.has(occurrenceKey)) return true;
  try {
    const v = await AsyncStorage.getItem(`${STOP_KEY_PREFIX}${occurrenceKey}`);
    if (v === "1") {
      stoppedOccurrences.add(occurrenceKey);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function stopOccurrenceNag(
  occurrenceKey: string,
  persist: boolean
): Promise<void> {
  console.log(`[Notification] 停止提醒: ${occurrenceKey}, persist: ${persist}`);
  
  const active = activeNags.get(occurrenceKey);
  if (active) {
    clearInterval(active.timer);
    activeNags.delete(occurrenceKey);
    console.log(`[Notification] 已清除定时器: ${occurrenceKey}`);
  }

  // 无论是否persist，都先加入内存缓存，防止立即重新触发
  stoppedOccurrences.add(occurrenceKey);

  if (persist) {
    try {
      await AsyncStorage.setItem(`${STOP_KEY_PREFIX}${occurrenceKey}`, "1");
      console.log(`[Notification] 已持久化停止状态: ${occurrenceKey}`);
    } catch (e) {
      console.warn(`[Notification] 持久化停止状态失败:`, e);
    }
  }
}

// 判断事件是否为时间段类型（有开始和结束时间）
function isTimeRangeEvent(event: CalendarEvent): { isRange: boolean; endTime?: dayjs.Dayjs } {
  if (event.type === "schedule" && event.payload) {
    try {
      const payload = JSON.parse(event.payload);
      if (payload.endDate && payload.endTime && !payload.isAllDay) {
        const endDateTime = dayjs(`${payload.endDate} ${payload.endTime}`, "YYYY-MM-DD HH:mm");
        if (endDateTime.isValid()) {
          return { isRange: true, endTime: endDateTime };
        }
      }
    } catch {
      // ignore
    }
  }
  return { isRange: false };
}

// 计算提醒结束时间
function calculateNagEndTime(event: CalendarEvent): dayjs.Dayjs {
  const { isRange, endTime } = isTimeRangeEvent(event);
  
  if (isRange && endTime) {
    // 时间段类型：在结束时间停止提醒
    console.log(`[Notification] 时间段事件，结束时间: ${endTime.format("YYYY-MM-DD HH:mm")}`);
    return endTime;
  } else {
    // 闹钟类型（时刻）：最多提醒5分钟
    const alarmEnd = dayjs().add(DEFAULT_ALARM_MAX_DURATION_MIN, "minute");
    console.log(`[Notification] 闹钟事件，最多提醒到: ${alarmEnd.format("YYYY-MM-DD HH:mm")}`);
    return alarmEnd;
  }
}


export async function startEventNagging(
  event: CalendarEvent,
  options?: { intervalMs?: number }
): Promise<void> {
  if (isExpoGo) return;

  // 没设置提醒或设置为不提醒(-1)，不启动循环
  if (event.remindOffsetMin === undefined || event.remindOffsetMin < 0) {
    return;
  }

  await ensureNotificationCategoriesInitialized();

  const occurrenceKey = getOccurrenceKey(event.id, event.date);
  
  // 检查是否已停止
  if (await isOccurrenceStopped(occurrenceKey)) {
    console.log(`[Notification] 事件已被用户停止: ${occurrenceKey}`);
    return;
  }
  
  // 检查是否已在提醒中
  if (activeNags.has(occurrenceKey)) {
    console.log(`[Notification] 事件已在提醒中: ${occurrenceKey}`);
    return;
  }

  const intervalMs = options?.intervalMs ?? DEFAULT_NAG_INTERVAL_MS;
  const endAt = calculateNagEndTime(event).valueOf();

  console.log(`[Notification] 开始循环提醒: ${event.title}, 间隔: ${intervalMs}ms, 结束时间: ${dayjs(endAt).format("HH:mm:ss")}`);

  // 立即发送第一条通知
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: buildNotificationTitle(event),
        body: buildNotificationBody(event),
        data: {
          eventId: event.id,
          date: event.date,
          occurrenceKey,
        },
        sound: true,
        categoryIdentifier: REMINDER_CATEGORY_ID,
      },
      trigger: null,
    });
    console.log(`[Notification] 已发送首条通知: ${event.title}`);
  } catch (e) {
    console.error(`[Notification] 发送首条通知失败:`, e);
  }

  const activeNag: ActiveNag = {
    timer: setInterval(() => {
      const now = Date.now();
      
      // 检查是否超时
      if (now >= endAt) {
        console.log(`[Notification] 提醒时间到期，停止: ${occurrenceKey}`);
        void stopOccurrenceNag(occurrenceKey, false);
        return;
      }

      // 再次检查是否被用户停止（内存中）
      if (stoppedOccurrences.has(occurrenceKey)) {
        console.log(`[Notification] 检测到用户已停止，清理定时器: ${occurrenceKey}`);
        const slot = activeNags.get(occurrenceKey);
        if (slot) {
          clearInterval(slot.timer);
          activeNags.delete(occurrenceKey);
        }
        return;
      }

      const slot = activeNags.get(occurrenceKey);
      if (!slot || slot.sending) return;

      slot.sending = true;
      void (async () => {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: buildNotificationTitle(event),
              body: buildNotificationBody(event),
              data: {
                eventId: event.id,
                date: event.date,
                occurrenceKey,
              },
              sound: true,
              categoryIdentifier: REMINDER_CATEGORY_ID,
            },
            trigger: null,
          });
          console.log(`[Notification] 循环提醒: ${event.title}`);
        } catch (e) {
          console.error(`[Notification] 循环提醒失败:`, e);
        } finally {
          const still = activeNags.get(occurrenceKey);
          if (still) still.sending = false;
        }
      })();
    }, intervalMs),
    sending: false,
    endAt,
  };

  activeNags.set(occurrenceKey, activeNag);
}

export async function stopEventNagging(
  eventId: string,
  date: string,
  persist: boolean = true
): Promise<void> {
  if (isExpoGo) return;
  const occurrenceKey = getOccurrenceKey(eventId, date);
  await stopOccurrenceNag(occurrenceKey, persist);
}


// 前台"到点监听"：每 5 秒检查一次今天的事件；到提醒时间后启动 nagging
export function startDueEventWatcher(options?: {
  watchIntervalMs?: number;
  nagIntervalMs?: number;
}): void {
  if (isExpoGo) return;
  if (dueWatcherTimer) return;

  const watchIntervalMs =
    options?.watchIntervalMs ?? DEFAULT_DUE_WATCH_INTERVAL_MS;
  const nagIntervalMs = options?.nagIntervalMs ?? DEFAULT_NAG_INTERVAL_MS;

  const check = async () => {
    if (currentAppState !== "active") return;

    const db = getDb();
    const today = dayjs().format("YYYY-MM-DD");
    const events = await getEventsByDate(db, today);
    const now = dayjs();

    for (const event of events) {
      if (event.remindOffsetMin === undefined || event.remindOffsetMin < 0)
        continue;

      const notifyTime = buildNotifyTime(event);
      const nagEndTime = calculateNagEndTime(event);

      // 在提醒时间之后且在结束时间之前，启动循环提醒
      if (now.isAfter(notifyTime) && now.isBefore(nagEndTime)) {
        await startEventNagging(event, {
          intervalMs: nagIntervalMs,
        });
      }
    }
  };

  appStateSubscription = AppState.addEventListener("change", (state) => {
    currentAppState = state;
  });

  dueWatcherTimer = setInterval(() => {
    void check();
  }, watchIntervalMs);

  void check();
}

export function stopDueEventWatcher(): void {
  if (dueWatcherTimer) {
    clearInterval(dueWatcherTimer);
    dueWatcherTimer = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

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

    await ensureNotificationCategoriesInitialized();

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
  if (isExpoGo) {
    return null;
  }

  // 如果没有设置提醒或设置为不提醒(-1)，不安排通知
  if (event.remindOffsetMin === undefined || event.remindOffsetMin < 0) {
    return null;
  }

  await ensureNotificationCategoriesInitialized();

  // 计算通知时间
  const notifyTime = buildNotifyTime(event);

  // 如果通知时间已过，不安排
  if (notifyTime.isBefore(dayjs())) {
    return null;
  }

  // 先取消之前的通知（如果有）
  await cancelEventNotification(event.id);

  const title = buildNotificationTitle(event);
  const body = buildNotificationBody(event);
  const occurrenceKey = getOccurrenceKey(event.id, event.date);

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { eventId: event.id, date: event.date, occurrenceKey },
        sound: true,
        categoryIdentifier: REMINDER_CATEGORY_ID,
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
    void (async () => {
      const data = response.notification.request.content.data;
      const actionId = response.actionIdentifier;
      const notificationId = response.notification.request.identifier;

      console.log(`[Notification] 收到通知响应, actionId: ${actionId}`);

      // 点击了"不再提醒"按钮：停止当前事件(当天)的循环提醒，并清除通知栏
      if (actionId === STOP_REMINDING_ACTION_ID) {
        console.log(`[Notification] 用户点击了"不再提醒"按钮`);
        if (data?.eventId && data?.date) {
          const occurrenceKey =
            (data as any)?.occurrenceKey ??
            getOccurrenceKey(String(data.eventId), String(data.date));
          console.log(`[Notification] 停止提醒: ${occurrenceKey}`);
          await stopOccurrenceNag(String(occurrenceKey), true);
        }
        // 清除通知栏中该事件的所有通知
        try {
          await Notifications.dismissNotificationAsync(notificationId);
          // 同时清除所有已展示的通知（因为循环提醒会产生多条）
          await Notifications.dismissAllNotificationsAsync();
          console.log(`[Notification] 已清除通知栏通知`);
        } catch (e) {
          console.warn(`[Notification] 清除通知失败:`, e);
        }
        return;
      }

      // 默认点击（打开通知）：也停止循环提醒，因为用户已经看到了
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        console.log(`[Notification] 用户点击了通知，停止循环提醒`);
        if (data?.eventId && data?.date) {
          const occurrenceKey =
            (data as any)?.occurrenceKey ??
            getOccurrenceKey(String(data.eventId), String(data.date));
          await stopOccurrenceNag(String(occurrenceKey), true);
        }
        // 清除通知栏
        try {
          await Notifications.dismissAllNotificationsAsync();
        } catch (e) {
          console.warn(`[Notification] 清除通知失败:`, e);
        }
        // 继续执行回调跳转
        if (data?.eventId) {
          callback(data.eventId as string, data.date as string);
        }
      }
    })();
  });
}

// 添加通知接收监听器 - 当通知触发时启动循环提醒
export function addNotificationReceivedListener(
  callback?: (notification: Notifications.Notification) => void
): Notifications.EventSubscription | null {
  if (isExpoGo) {
    return null;
  }

  return Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data;
    
    console.log(`[Notification] 收到通知触发: ${notification.request.content.title}`);
    
    // 当通知触发时，启动循环提醒
    if (data?.eventId && data?.date) {
      const eventId = String(data.eventId);
      
      try {
        const db = getDb();
        const event = await getEventById(db, eventId);
        
        if (event && event.remindOffsetMin !== undefined && event.remindOffsetMin >= 0) {
          console.log(`[Notification] 启动循环提醒: ${event.title}`);
          await startEventNagging(event);
        }
      } catch (e) {
        console.error(`[Notification] 启动循环提醒失败:`, e);
      }
    }
    
    // 调用用户回调
    if (callback) {
      callback(notification);
    }
  });
}
