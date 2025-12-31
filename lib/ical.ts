/**
 * iCal 导入导出功能
 * 参考 RFC 5545 标准实现
 */

import dayjs from "dayjs";
import * as DocumentPicker from "expo-document-picker";
import {
  EncodingType,
  cacheDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { CalendarEvent, addEvent, getAllEvents, getDb } from "./database";

// iCal 文件头
const VCALENDAR_BEGIN = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyCalendarApp//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

const VCALENDAR_END = "END:VCALENDAR";

// 转义 iCal 特殊字符
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// 反转义 iCal 特殊字符
function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// 将重复规则转换为 iCal RRULE
function repeatRuleToRRule(repeatRule?: string): string | null {
  switch (repeatRule) {
    case "daily":
      return "RRULE:FREQ=DAILY";
    case "weekly":
      return "RRULE:FREQ=WEEKLY";
    case "monthly":
      return "RRULE:FREQ=MONTHLY";
    case "yearly":
      return "RRULE:FREQ=YEARLY";
    default:
      return null;
  }
}

// 将 iCal RRULE 转换为重复规则
function rRuleToRepeatRule(rrule: string): string {
  if (rrule.includes("FREQ=DAILY")) return "daily";
  if (rrule.includes("FREQ=WEEKLY")) return "weekly";
  if (rrule.includes("FREQ=MONTHLY")) return "monthly";
  if (rrule.includes("FREQ=YEARLY")) return "yearly";
  return "none";
}

// 将事件转换为 VEVENT
function eventToVEvent(event: CalendarEvent): string {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");

  // UID (唯一标识符)
  lines.push(`UID:${event.id}@mycalendarapp`);

  // DTSTAMP (时间戳)
  lines.push(`DTSTAMP:${dayjs().format("YYYYMMDDTHHmmss")}Z`);

  // DTSTART (开始时间)
  if (event.time) {
    const dateTime = dayjs(`${event.date} ${event.time}`, "YYYY-MM-DD HH:mm");
    lines.push(`DTSTART:${dateTime.format("YYYYMMDDTHHmmss")}`);
  } else {
    // 全天事件
    lines.push(`DTSTART;VALUE=DATE:${dayjs(event.date).format("YYYYMMDD")}`);
  }

  // SUMMARY (标题)
  lines.push(`SUMMARY:${escapeICalText(event.title)}`);

  // DESCRIPTION (描述)
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  // CATEGORIES (类型)
  if (event.type) {
    lines.push(`CATEGORIES:${event.type.toUpperCase()}`);
  }

  // RRULE (重复规则)
  const rrule = repeatRuleToRRule(event.repeatRule);
  if (rrule) {
    lines.push(rrule);
  }

  // VALARM (提醒)
  if (event.remindOffsetMin !== undefined && event.remindOffsetMin >= 0) {
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeICalText(event.title)}`);
    if (event.remindOffsetMin === 0) {
      lines.push("TRIGGER:PT0M");
    } else {
      lines.push(`TRIGGER:-PT${event.remindOffsetMin}M`);
    }
    lines.push("END:VALARM");
  }

  // X-APPLE-TRAVEL-ADVISORY-BEHAVIOR (颜色，自定义属性)
  if (event.color) {
    lines.push(`X-COLOR:${event.color}`);
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

// 解析 VEVENT 为事件对象
function parseVEvent(veventText: string): Partial<CalendarEvent> | null {
  const lines = veventText.split(/\r?\n/);
  const event: Partial<CalendarEvent> = {
    type: "schedule",
    repeatRule: "none",
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 处理折叠行（以空格或制表符开头的行是前一行的延续）
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
        // 使用 UID 的一部分作为 ID，或者生成新的
        event.id = value.split("@")[0] || Date.now().toString();
        break;

      case "SUMMARY":
        event.title = unescapeICalText(value);
        break;

      case "DESCRIPTION":
        event.description = unescapeICalText(value);
        break;

      case "DTSTART":
        // 解析日期时间
        if (line.includes("VALUE=DATE")) {
          // 全天事件
          event.date = dayjs(value, "YYYYMMDD").format("YYYY-MM-DD");
        } else if (value.includes("T")) {
          // 包含时间
          const dt = dayjs(value.replace("Z", ""), "YYYYMMDDTHHmmss");
          event.date = dt.format("YYYY-MM-DD");
          event.time = dt.format("HH:mm");
        } else {
          event.date = dayjs(value, "YYYYMMDD").format("YYYY-MM-DD");
        }
        break;

      case "CATEGORIES":
        const category = value.toLowerCase();
        if (
          [
            "reminder",
            "schedule",
            "course",
            "countdown",
            "birthday",
            "anniversary",
          ].includes(category)
        ) {
          event.type = category as CalendarEvent["type"];
        }
        break;

      case "RRULE":
        event.repeatRule = rRuleToRepeatRule(value);
        break;

      case "X-COLOR":
        event.color = value;
        break;
    }

    // 解析 VALARM 中的 TRIGGER
    if (key === "TRIGGER" && veventText.includes("BEGIN:VALARM")) {
      // 解析如 -PT15M, PT0M 等格式
      const match = value.match(/-?PT(\d+)M/);
      if (match) {
        event.remindOffsetMin = parseInt(match[1], 10);
      } else if (value === "PT0M" || value === "-PT0M") {
        event.remindOffsetMin = 0;
      }
    }
  }

  // 验证必要字段
  if (!event.title || !event.date) {
    return null;
  }

  return event;
}

// 导出所有事件为 iCal 文件
export async function exportEventsToICS(): Promise<string | null> {
  try {
    const db = getDb();
    const events = await getAllEvents(db);

    if (events.length === 0) {
      return null;
    }

    // 构建 iCal 内容
    const vevents = events.map((e) => eventToVEvent(e));
    const icsContent = [VCALENDAR_BEGIN, ...vevents, VCALENDAR_END].join(
      "\r\n"
    );

    // 保存到临时文件
    const fileName = `calendar_export_${dayjs().format("YYYYMMDD_HHmmss")}.ics`;
    const filePath = `${cacheDirectory}${fileName}`;

    await writeAsStringAsync(filePath, icsContent, {
      encoding: EncodingType.UTF8,
    });

    return filePath;
  } catch (error) {
    console.error("导出失败:", error);
    return null;
  }
}

// 分享导出的 iCal 文件
export async function shareICSFile(): Promise<boolean> {
  try {
    const filePath = await exportEventsToICS();

    if (!filePath) {
      return false;
    }

    // 检查是否支持分享
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.log("分享功能不可用");
      return false;
    }

    await Sharing.shareAsync(filePath, {
      mimeType: "text/calendar",
      dialogTitle: "导出日历",
      UTI: "public.calendar-event",
    });

    return true;
  } catch (error) {
    console.error("分享失败:", error);
    return false;
  }
}

// 从 iCal 文件导入事件
export async function importEventsFromICS(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    // 选择文件
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/calendar", "application/ics", "*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, count: 0, message: "未选择文件" };
    }

    const file = result.assets[0];

    // 检查文件扩展名
    if (!file.name.toLowerCase().endsWith(".ics")) {
      return { success: false, count: 0, message: "请选择 .ics 文件" };
    }

    // 读取文件内容
    const content = await readAsStringAsync(file.uri, {
      encoding: EncodingType.UTF8,
    });

    // 验证是否是有效的 iCal 文件
    if (
      !content.includes("BEGIN:VCALENDAR") ||
      !content.includes("END:VCALENDAR")
    ) {
      return { success: false, count: 0, message: "无效的 iCal 文件格式" };
    }

    // 提取所有 VEVENT
    const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
    const vevents = content.match(veventRegex) || [];

    if (vevents.length === 0) {
      return { success: false, count: 0, message: "文件中没有找到事件" };
    }

    // 解析并导入事件
    const db = getDb();
    let importedCount = 0;

    for (const vevent of vevents) {
      const eventData = parseVEvent(vevent);
      if (eventData && eventData.title && eventData.date) {
        try {
          await addEvent(db, {
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            description: eventData.description,
            color: eventData.color || "#A1CEDC",
            remindOffsetMin: eventData.remindOffsetMin,
            repeatRule: eventData.repeatRule || "none",
            type: eventData.type || "schedule",
            payload: "",
          });
          importedCount++;
        } catch (err) {
          console.error("导入事件失败:", err);
        }
      }
    }

    return {
      success: true,
      count: importedCount,
      message: `成功导入 ${importedCount} 个事件`,
    };
  } catch (error) {
    console.error("导入失败:", error);
    return { success: false, count: 0, message: `导入失败: ${error}` };
  }
}

// 导出指定日期范围的事件
export async function exportEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<string | null> {
  try {
    const db = getDb();
    const events = await getAllEvents(db);

    // 筛选日期范围内的事件
    const filteredEvents = events.filter(
      (e) => e.date >= startDate && e.date <= endDate
    );

    if (filteredEvents.length === 0) {
      return null;
    }

    // 构建 iCal 内容
    const vevents = filteredEvents.map((e) => eventToVEvent(e));
    const icsContent = [VCALENDAR_BEGIN, ...vevents, VCALENDAR_END].join(
      "\r\n"
    );

    // 保存到临时文件
    const fileName = `calendar_${startDate}_${endDate}.ics`;
    const filePath = `${cacheDirectory}${fileName}`;

    await writeAsStringAsync(filePath, icsContent, {
      encoding: EncodingType.UTF8,
    });

    return filePath;
  } catch (error) {
    console.error("导出失败:", error);
    return null;
  }
}
