/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#007AFF";
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#8E8E93",
    textTertiary: "#C7C7CC",
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceSecondary: "#F2F2F7",
    card: "#FFFFFF",
    tint: tintColorLight,
    primary: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    icon: "#8E8E93",
    border: "#C6C6C8",
    borderLight: "#E5E5EA",
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorLight,
    // 日历专用颜色
    today: "#007AFF",
    selected: "#007AFF",
    selectedText: "#FFFFFF",
    weekend: "#FF3B30",
    lunar: "#8E8E93",
    festival: "#FF3B30",
    solarTerm: "#34C759",
    // 事件颜色预设
    eventColors: [
      "#007AFF",
      "#5856D6",
      "#34C759",
      "#FF9500",
      "#FF3B30",
      "#AF52DE",
      "#00C7BE",
      "#FF2D55",
    ],
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    textTertiary: "#48484A",
    background: "#000000",
    surface: "#1C1C1E",
    surfaceSecondary: "#2C2C2E",
    card: "#1C1C1E",
    tint: tintColorDark,
    primary: "#0A84FF",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
    icon: "#8E8E93",
    border: "#38383A",
    borderLight: "#2C2C2E",
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorDark,
    // 日历专用颜色
    today: "#0A84FF",
    selected: "#0A84FF",
    selectedText: "#FFFFFF",
    weekend: "#FF453A",
    lunar: "#8E8E93",
    festival: "#FF453A",
    solarTerm: "#30D158",
    // 事件颜色预设
    eventColors: [
      "#0A84FF",
      "#5E5CE6",
      "#30D158",
      "#FF9F0A",
      "#FF453A",
      "#BF5AF2",
      "#63E6E2",
      "#FF375F",
    ],
  },
};

// 日历事件颜色预设
export const EventColors = {
  blue: "#007AFF",
  purple: "#5856D6",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  pink: "#FF2D55",
  teal: "#00C7BE",
  indigo: "#5E5CE6",
};

// 圆角尺寸
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// 间距
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// 阴影
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
