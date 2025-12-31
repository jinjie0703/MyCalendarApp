export type LunarInfo = {
  /** Lunar day label to show in the calendar cell (e.g. "初一", "十五") */
  lunarDay: string;
  /** Festival label (takes priority over solar term and lunarDay) */
  isFestival?: string;
  /** Solar term label (takes priority over lunarDay) */
  isTerm?: string;
};

/**
 * Minimal implementation to satisfy the app and unblock builds.
 *
 * If you later add a real lunar/solar-term library, keep this function signature
 * and replace the internals.
 */
export function getLunarDate(_dateString: string): LunarInfo {
  return {
    lunarDay: "",
  };
}

