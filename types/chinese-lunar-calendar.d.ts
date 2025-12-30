declare module "chinese-lunar-calendar" {
  export type LunarInfo = {
    lunarDay: string;
    lunarMonth: number;
    lunarMonthName?: string;
    lunarFestival?: string | null;
    solarFestival?: string | null;
    solarTerm?: string | null;
    [key: string]: unknown;
  };

  /** get lunar info by solar date */
  export function getLunar(year: number, month: number, day: number): LunarInfo;
}
