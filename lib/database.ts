import * as SQLite from "expo-sqlite";

// expo-sqlite (SDK 50+ / 51+ / 52+ / 53+ / 54+) 推荐使用 sync API：openDatabaseSync / execSync
// 这样类型也更匹配（不会出现 openDatabase/transaction 不存在的问题）

export type EventType =
  | "reminder"
  | "schedule"
  | "course"
  | "countdown"
  | "birthday"
  | "anniversary";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description?: string;
  color?: string;
  remindOffsetMin?: number; // 提前多少分钟提醒：0=任务发生时，5=提前5分钟...
  repeatRule?: string; // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  type: EventType;
  payload?: string; // JSON string for extra data
}

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("events.db");
  }
  return db;
};

// 数据库初始化（建表）
export const initDatabase = async () => {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      description TEXT,
      color TEXT,
      remindOffsetMin INTEGER,
      repeatRule TEXT,
      type TEXT,
      payload TEXT
    );
  `);

  // 兼容旧版本数据库：尝试补充字段（如果已存在会报错，忽略即可）
  try {
    database.execSync("ALTER TABLE events ADD COLUMN remindOffsetMin INTEGER");
  } catch {}
  try {
    database.execSync("ALTER TABLE events ADD COLUMN repeatRule TEXT");
  } catch {}
  try {
    database.execSync("ALTER TABLE events ADD COLUMN type TEXT");
  } catch {}
  try {
    database.execSync("ALTER TABLE events ADD COLUMN payload TEXT");
  } catch {}

  return database;
};

// 添加事件
export const addEvent = async (
  database: SQLite.SQLiteDatabase,
  event: Omit<CalendarEvent, "id">
): Promise<CalendarEvent> => {
  const id = Date.now().toString();

  database.runSync(
    "INSERT INTO events (id, title, date, time, description, color, remindOffsetMin, repeatRule, type, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      event.title,
      event.date,
      event.time ?? "",
      event.description ?? "",
      event.color ?? "#A1CEDC",
      event.remindOffsetMin ?? 0,
      event.repeatRule ?? "none",
      event.type,
      event.payload ?? "",
    ]
  );

  return { ...event, id };
};

// 获取某天的事件
export const getEventsByDate = async (
  database: SQLite.SQLiteDatabase,
  date: string
): Promise<CalendarEvent[]> => {
  const rows = database.getAllSync<CalendarEvent>(
    "SELECT * FROM events WHERE date = ? ORDER BY time ASC",
    [date]
  );

  // 兼容：把空字符串转换成 undefined（可选）
  return rows.map((r) => ({
    ...r,
    time: r.time || undefined,
    description: r.description || undefined,
    color: r.color || undefined,
    // SQLite 读出来可能是 null/undefined
    remindOffsetMin: (r as any).remindOffsetMin ?? undefined,
    repeatRule: (r as any).repeatRule || undefined,
    type: (r as any).type ?? "reminder",
    payload: (r as any).payload || undefined,
  }));
};

// 获取单个事件
export const getEventById = async (
  database: SQLite.SQLiteDatabase,
  id: string
): Promise<CalendarEvent | null> => {
  const rows = database.getAllSync<CalendarEvent>(
    "SELECT * FROM events WHERE id = ? LIMIT 1",
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    ...r,
    time: r.time || undefined,
    description: r.description || undefined,
    color: r.color || undefined,
    remindOffsetMin: (r as any).remindOffsetMin ?? undefined,
    repeatRule: (r as any).repeatRule || undefined,
    type: (r as any).type ?? "reminder",
    payload: (r as any).payload || undefined,
  };
};

// 更新事件
export const updateEvent = async (
  database: SQLite.SQLiteDatabase,
  id: string,
  patch: Omit<CalendarEvent, "id">
): Promise<void> => {
  database.runSync(
    "UPDATE events SET title = ?, date = ?, time = ?, description = ?, color = ?, remindOffsetMin = ?, repeatRule = ?, type = ?, payload = ? WHERE id = ?",
    [
      patch.title,
      patch.date,
      patch.time ?? "",
      patch.description ?? "",
      patch.color ?? "#A1CEDC",
      patch.remindOffsetMin ?? 0,
      patch.repeatRule ?? "none",
      patch.type,
      patch.payload ?? "",
      id,
    ]
  );
};

// 删除事件
export const deleteEvent = async (
  database: SQLite.SQLiteDatabase,
  id: string
): Promise<void> => {
  database.runSync("DELETE FROM events WHERE id = ?", [id]);
};
