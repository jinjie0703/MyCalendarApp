/**
 * 日期工具函数
 * 提供日期计算、解析和格式化的辅助函数
 */

/**
 * 判断是否为闰年
 * 闰年规则：能被4整除但不能被100整除，或者能被400整除
 * @param year 年份
 * @returns 是否为闰年
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 获取指定年月的天数
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 该月的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  // 每月天数表 (索引0对应1月)
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // 验证月份范围
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
  }

  // 2月特殊处理闰年
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return daysPerMonth[month - 1];
}

/**
 * 日期组件接口
 */
export interface DateComponents {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * 时间组件接口
 */
export interface TimeComponents {
  hour: number; // 0-23
  minute: number; // 0-59
}

/**
 * 从 Date 对象解析日期组件
 * @param date Date 对象
 * @returns 日期组件
 */
export function parseDateComponents(date: Date): DateComponents {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // JavaScript 月份从0开始
    day: date.getDate(),
  };
}

/**
 * 从 Date 对象解析时间组件
 * @param date Date 对象
 * @returns 时间组件
 */
export function parseTimeComponents(date: Date): TimeComponents {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

/**
 * 从日期组件创建 Date 对象
 * @param components 日期组件
 * @param time 可选的时间组件
 * @returns Date 对象
 */
export function createDateFromComponents(
  components: DateComponents,
  time?: TimeComponents
): Date {
  const { year, month, day } = components;
  const hour = time?.hour ?? 0;
  const minute = time?.minute ?? 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 * @param date Date 对象
 * @returns 格式化的日期字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:mm 字符串
 * @param date Date 对象
 * @returns 格式化的时间字符串
 */
export function formatTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm 字符串
 * @param date Date 对象
 * @returns 格式化的日期时间字符串
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 解析时间字符串为时间组件
 * @param timeString HH:mm 格式的时间字符串
 * @returns 时间组件
 */
export function parseTimeString(timeString: string): TimeComponents {
  const [hourStr, minuteStr] = timeString.split(":");
  return {
    hour: parseInt(hourStr, 10) || 0,
    minute: parseInt(minuteStr, 10) || 0,
  };
}

/**
 * 调整日期，确保日期在有效范围内
 * 当月份变化导致日期超出范围时，自动调整到该月最后一天
 * @param year 年份
 * @param month 月份 (1-12)
 * @param day 日期
 * @returns 调整后的有效日期
 */
export function clampDay(year: number, month: number, day: number): number {
  const maxDay = getDaysInMonth(year, month);
  return Math.min(Math.max(1, day), maxDay);
}

/**
 * 生成年份数组
 * @param minYear 最小年份
 * @param maxYear 最大年份
 * @returns 年份数组
 */
export function generateYearRange(
  minYear: number,
  maxYear: number
): { value: number; label: string }[] {
  const years: { value: number; label: string }[] = [];
  for (let year = minYear; year <= maxYear; year++) {
    years.push({ value: year, label: `${year}年` });
  }
  return years;
}

/**
 * 生成月份数组 (1-12)
 * @returns 月份数组
 */
export function generateMonthRange(): { value: number; label: string }[] {
  const months: { value: number; label: string }[] = [];
  for (let month = 1; month <= 12; month++) {
    months.push({ value: month, label: `${month}月` });
  }
  return months;
}

/**
 * 生成日期数组
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 日期数组
 */
export function generateDayRange(
  year: number,
  month: number
): { value: number; label: string }[] {
  const daysInMonth = getDaysInMonth(year, month);
  const days: { value: number; label: string }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ value: day, label: `${day}日` });
  }
  return days;
}

/**
 * 生成小时数组 (0-23)
 * @returns 小时数组
 */
export function generateHourRange(): { value: number; label: string }[] {
  const hours: { value: number; label: string }[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    hours.push({ value: hour, label: String(hour).padStart(2, "0") });
  }
  return hours;
}

/**
 * 生成分钟数组
 * @param interval 分钟间隔，默认为1
 * @returns 分钟数组
 */
export function generateMinuteRange(
  interval: number = 1
): { value: number; label: string }[] {
  const minutes: { value: number; label: string }[] = [];
  for (let minute = 0; minute <= 59; minute += interval) {
    minutes.push({ value: minute, label: String(minute).padStart(2, "0") });
  }
  return minutes;
}
