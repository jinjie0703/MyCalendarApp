/**
 * 黄历（老黄历）模块
 * 提供宜、忌、冲煞等信息
 */

import { Solar } from "lunar-javascript";

export interface AlmanacInfo {
  /** 标题：农历日期 + 干支纪年 */
  title: string;
  /** 宜做的事情 */
  yi: string[];
  /** 忌做的事情 */
  ji: string[];
  /** 冲煞信息 */
  chongSha: string;
  /** 干支纪年 */
  ganZhi: string;
  /** 生肖 */
  shengXiao: string;
}

/**
 * 获取指定日期的黄历信息
 * @param dateString 日期字符串 YYYY-MM-DD
 */
export function getAlmanacInfo(dateString: string): AlmanacInfo | null {
  try {
    const date = new Date(dateString);
    const solar = Solar.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    const lunar = solar.getLunar();

    const title = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    const yi = lunar.getDayYi() as string[];
    const ji = lunar.getDayJi() as string[];
    const chongSha = `冲${lunar.getChongDesc()} 煞${lunar.getSha()}`;
    const ganZhi = `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
    const shengXiao = lunar.getYearShengXiao();

    return {
      title,
      yi,
      ji,
      chongSha,
      ganZhi,
      shengXiao,
    };
  } catch (e) {
    console.error("获取黄历信息失败:", e);
    return null;
  }
}

/**
 * 格式化黄历信息为多行文本
 * @param dateString 日期字符串 YYYY-MM-DD
 */
export function formatAlmanacText(dateString: string): string {
  const info = getAlmanacInfo(dateString);
  if (!info) return "黄历获取失败";

  const lines = [
    `${info.title}  (${info.ganZhi})`,
    `宜: ${info.yi.join(" ")}`,
    `忌: ${info.ji.join(" ")}`,
    `冲煞: ${info.chongSha}`,
  ];

  return lines.join("\n");
}
