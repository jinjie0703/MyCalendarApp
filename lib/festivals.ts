/**
 * 节日数据模块
 * 包含公历节日和农历节日的定义
 */

// 公历节日（月-日格式，无前导零）
export const solarFestivals: Record<string, string> = {
  "1-1": "元旦",
  "2-14": "情人节",
  "3-8": "妇女节",
  "3-12": "植树节",
  "4-1": "愚人节",
  "5-1": "劳动节",
  "5-4": "青年节",
  "6-1": "儿童节",
  "7-1": "建党节",
  "8-1": "建军节",
  "9-10": "教师节",
  "10-1": "国庆节",
  "12-25": "圣诞节",
};

// 农历节日（月-日格式，无前导零）
export const lunarFestivals: Record<string, string> = {
  "1-1": "春节",
  "1-15": "元宵节",
  "2-2": "龙抬头",
  "5-5": "端午节",
  "7-7": "七夕",
  "7-15": "中元节",
  "8-15": "中秋节",
  "9-9": "重阳节",
  "12-8": "腊八节",
  "12-30": "除夕", // 注意：小月时是腊月廿九
};

/**
 * 获取公历节日
 * @param month 月份（1-12）
 * @param day 日期（1-31）
 */
export function getSolarFestival(month: number, day: number): string | null {
  const key = `${month}-${day}`;
  return solarFestivals[key] || null;
}

/**
 * 获取农历节日
 * @param lunarMonth 农历月份（1-12）
 * @param lunarDay 农历日期（1-30）
 */
export function getLunarFestival(
  lunarMonth: number,
  lunarDay: number
): string | null {
  const key = `${lunarMonth}-${lunarDay}`;
  return lunarFestivals[key] || null;
}
