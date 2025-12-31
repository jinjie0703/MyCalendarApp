/**
 * 视图模式管理 Hook
 */

import { useCallback, useState } from "react";

export type ViewMode = "month" | "week" | "day";

export function useViewMode(initialMode: ViewMode = "month") {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const switchToMonth = useCallback(() => setViewMode("month"), []);
  const switchToWeek = useCallback(() => setViewMode("week"), []);
  const switchToDay = useCallback(() => setViewMode("day"), []);

  return {
    viewMode,
    setViewMode,
    switchToMonth,
    switchToWeek,
    switchToDay,
  };
}
