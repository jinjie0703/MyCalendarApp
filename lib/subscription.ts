/**
 * 网络日历订阅功能
 * 支持订阅 iCal URL（如 Google Calendar、Outlook 等公开日历）
 */

import dayjs from "dayjs";
import { CalendarEvent, getDb } from "./database";

export interface CalendarSubscription {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  syncInterval: number; // 同步间隔（分钟）
  createdAt: string;
}

// 初始化订阅表
export async function initSubscriptionTable(): Promise<void> {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      color TEXT DEFAULT '#4A90D9',
      enabled INTEGER DEFAULT 1,
      lastSync TEXT,
      syncInterval INTEGER DEFAULT 60,
      createdAt TEXT NOT NULL
    );
  `);

  // 为订阅事件添加来源标记
  try {
    db.execSync("ALTER TABLE events ADD COLUMN subscriptionId TEXT");
  } catch {}
}

// 获取所有订阅
export async function getAllSubscriptions(): Promise<CalendarSubscription[]> {
  const db = getDb();
  const rows = db.getAllSync<any>(
    "SELECT * FROM subscriptions ORDER BY createdAt DESC"
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    color: r.color || "#4A90D9",
    enabled: r.enabled === 1,
    lastSync: r.lastSync || undefined,
    syncInterval: r.syncInterval || 60,
    createdAt: r.createdAt,
  }));
}

// 添加订阅
export async function addSubscription(
  subscription: Omit<CalendarSubscription, "id" | "createdAt" | "lastSync">
): Promise<CalendarSubscription> {
  const db = getDb();
  const id = Date.now().toString();
  const createdAt = dayjs().format("YYYY-MM-DD HH:mm:ss");

  db.runSync(
    "INSERT INTO subscriptions (id, name, url, color, enabled, syncInterval, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      subscription.name,
      subscription.url,
      subscription.color,
      subscription.enabled ? 1 : 0,
      subscription.syncInterval,
      createdAt,
    ]
  );

  return {
    id,
    ...subscription,
    createdAt,
  };
}

// 更新订阅
export async function updateSubscription(
  id: string,
  patch: Partial<CalendarSubscription>
): Promise<void> {
  const db = getDb();

  const updates: string[] = [];
  const values: any[] = [];

  if (patch.name !== undefined) {
    updates.push("name = ?");
    values.push(patch.name);
  }
  if (patch.url !== undefined) {
    updates.push("url = ?");
    values.push(patch.url);
  }
  if (patch.color !== undefined) {
    updates.push("color = ?");
    values.push(patch.color);
  }
  if (patch.enabled !== undefined) {
    updates.push("enabled = ?");
    values.push(patch.enabled ? 1 : 0);
  }
  if (patch.lastSync !== undefined) {
    updates.push("lastSync = ?");
    values.push(patch.lastSync);
  }
  if (patch.syncInterval !== undefined) {
    updates.push("syncInterval = ?");
    values.push(patch.syncInterval);
  }

  if (updates.length > 0) {
    values.push(id);
    db.runSync(
      `UPDATE subscriptions SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
  }
}

// 删除订阅
export async function deleteSubscription(id: string): Promise<void> {
  const db = getDb();

  // 删除订阅关联的事件
  db.runSync("DELETE FROM events WHERE subscriptionId = ?", [id]);

  // 删除订阅
  db.runSync("DELETE FROM subscriptions WHERE id = ?", [id]);
}

// 解析 iCal 内容
function parseICalContent(content: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = [];

  // 提取所有 VEVENT
  const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
  const vevents = content.match(veventRegex) || [];

  for (const vevent of vevents) {
    const event = parseVEvent(vevent);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

// 解析单个 VEVENT
function parseVEvent(veventText: string): Partial<CalendarEvent> | null {
  const lines = veventText.split(/\r?\n/);
  const event: Partial<CalendarEvent> = {
    type: "schedule",
    repeatRule: "none",
  };

  let uid = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 处理折叠行
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      line += lines[i + 1].substring(1);
      i++;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).split(";")[0].toUpperCase();
    const value = line.substring(colonIndex + 1);

    switch (key) {
      case "UID":
        uid = value;
        break;

      case "SUMMARY":
        event.title = value
          .replace(/\\n/g, "\n")
          .replace(/\\,/g, ",")
          .replace(/\\;/g, ";")
          .replace(/\\\\/g, "\\");
        break;

      case "DESCRIPTION":
        event.description = value
          .replace(/\\n/g, "\n")
          .replace(/\\,/g, ",")
          .replace(/\\;/g, ";")
          .replace(/\\\\/g, "\\");
        break;

      case "DTSTART":
        if (line.includes("VALUE=DATE")) {
          event.date = dayjs(value, "YYYYMMDD").format("YYYY-MM-DD");
        } else if (value.includes("T")) {
          const dt = dayjs(value.replace("Z", ""), "YYYYMMDDTHHmmss");
          event.date = dt.format("YYYY-MM-DD");
          event.time = dt.format("HH:mm");
        } else {
          event.date = dayjs(value, "YYYYMMDD").format("YYYY-MM-DD");
        }
        break;

      case "RRULE":
        if (value.includes("FREQ=DAILY")) event.repeatRule = "daily";
        else if (value.includes("FREQ=WEEKLY")) event.repeatRule = "weekly";
        else if (value.includes("FREQ=MONTHLY")) event.repeatRule = "monthly";
        else if (value.includes("FREQ=YEARLY")) event.repeatRule = "yearly";
        break;
    }
  }

  if (!event.title || !event.date) {
    return null;
  }

  // 使用 UID 的哈希作为 ID
  event.id = uid ? `sub-${hashCode(uid)}` : `sub-${Date.now()}`;

  return event;
}

// 简单的字符串哈希函数
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// 同步单个订阅
export async function syncSubscription(
  subscription: CalendarSubscription
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    // 获取远程 iCal 内容
    const response = await fetch(subscription.url, {
      headers: {
        Accept: "text/calendar",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        count: 0,
        message: `HTTP 错误: ${response.status}`,
      };
    }

    const content = await response.text();

    // 验证是否是有效的 iCal 文件
    if (!content.includes("BEGIN:VCALENDAR")) {
      return {
        success: false,
        count: 0,
        message: "无效的 iCal 格式",
      };
    }

    // 解析事件
    const events = parseICalContent(content);

    if (events.length === 0) {
      return {
        success: true,
        count: 0,
        message: "日历中没有事件",
      };
    }

    const db = getDb();

    // 删除该订阅的旧事件
    db.runSync("DELETE FROM events WHERE subscriptionId = ?", [
      subscription.id,
    ]);

    // 添加新事件
    let addedCount = 0;
    for (const event of events) {
      if (event.title && event.date) {
        try {
          db.runSync(
            "INSERT INTO events (id, title, date, time, description, color, remindOffsetMin, repeatRule, type, payload, subscriptionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              `${subscription.id}-${event.id}`,
              event.title,
              event.date,
              event.time || "",
              event.description || "",
              subscription.color,
              0,
              event.repeatRule || "none",
              "schedule",
              "",
              subscription.id,
            ]
          );
          addedCount++;
        } catch (err) {
          console.error("添加订阅事件失败:", err);
        }
      }
    }

    // 更新最后同步时间
    await updateSubscription(subscription.id, {
      lastSync: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    });

    return {
      success: true,
      count: addedCount,
      message: `成功同步 ${addedCount} 个事件`,
    };
  } catch (error) {
    console.error("同步订阅失败:", error);
    return {
      success: false,
      count: 0,
      message: `同步失败: ${error}`,
    };
  }
}

// 同步所有启用的订阅
export async function syncAllSubscriptions(): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  const subscriptions = await getAllSubscriptions();
  const enabledSubscriptions = subscriptions.filter((s) => s.enabled);

  let synced = 0;
  let failed = 0;

  for (const sub of enabledSubscriptions) {
    const result = await syncSubscription(sub);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return {
    total: enabledSubscriptions.length,
    synced,
    failed,
  };
}

// 验证 URL 是否是有效的 iCal 订阅
export async function validateSubscriptionUrl(
  url: string
): Promise<{ valid: boolean; name?: string; message: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/calendar",
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        message: `无法访问: HTTP ${response.status}`,
      };
    }

    const content = await response.text();

    if (!content.includes("BEGIN:VCALENDAR")) {
      return {
        valid: false,
        message: "不是有效的 iCal 格式",
      };
    }

    // 尝试提取日历名称
    const nameMatch = content.match(/X-WR-CALNAME:(.+)/);
    const name = nameMatch ? nameMatch[1].trim() : undefined;

    return {
      valid: true,
      name,
      message: "有效的 iCal 订阅",
    };
  } catch (error) {
    return {
      valid: false,
      message: `连接失败: ${error}`,
    };
  }
}
