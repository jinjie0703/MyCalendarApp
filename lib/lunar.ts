import { getLunar } from "chinese-lunar-calendar";
import { getLunarFestival, getSolarFestival } from "./festivals";

export interface LunarInfo {
  /** 农历日期标签（如 "初一", "十五"） */
  lunarDay: string;
  /** 农历月份 */
  lunarMonth: number;
  /** 农历日期（数字） */
  lunarDate: number;
  /** 节日标签（优先于节气和农历日期显示） */
  isFestival: string | null;
  /** 节气标签（优先于农历日期显示） */
  isTerm: string | null;
}

/**
 * 获取指定日期的农历信息
 * @param dateString 日期字符串 YYYY-MM-DD
 */
export function getLunarDate(dateString: string): LunarInfo {
  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const lunar = getLunar(date.getFullYear(), month, day);
    const lunarMonth = (lunar as any).lunarMonth as number;
    const lunarDate = (lunar as any).lunarDate as number;

    // 获取节日
    const lunarFestival = getLunarFestival(lunarMonth, lunarDate);
    const solarFestival = getSolarFestival(month, day);
    const festivalLabel = lunarFestival || solarFestival || null;

    // 获取节气
    const solarTerm = (lunar as any).solarTerm || null;

    return {
      lunarDay: String((lunar as any).dateStr || "").replace(/^.+月/, ""),
      lunarMonth,
      lunarDate,
      isFestival: festivalLabel,
      isTerm: solarTerm,
    };
  } catch (e) {
    console.error("获取农历信息失败:", e);
    return {
      lunarDay: "",
      lunarMonth: 0,
      lunarDate: 0,
      isFestival: null,
      isTerm: null,
    };
  }
}

/**
 * 获取显示用的农历/节日/节气标签
 * 优先级：节日 > 节气 > 农历日期
 */
export function getLunarDisplayLabel(dateString: string): string {
  const info = getLunarDate(dateString);
  return info.isFestival || info.isTerm || info.lunarDay || "";
}
