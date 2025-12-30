declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYearInGanZhi(): string;
    getYearShengXiao(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getChongDesc(): string;
    getSha(): string;
  }
}
