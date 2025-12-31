import React from "react";
import { Pressable } from "react-native";
import { getLunarDate } from "../lib/lunar";
import { ThemedText } from "./themed-text";

interface CustomDayProps {
  date?: {
    dateString: string;
    day: number;
    month: number;
    year: number;
  };
  state?: "disabled" | "today" | "selected" | "inactive" | "";
  onPress: (dateString: string) => void;
  isSelected: boolean;
}

export const CustomDay: React.FC<CustomDayProps> = ({
  date,
  state,
  onPress,
  isSelected,
}) => {
  if (!date) {
    return null;
  }

  const { dateString } = date;
  const lunarInfo = getLunarDate(dateString);

  // Display priority: Festival >= Solar Term > Lunar Date
  const festivalLabel = lunarInfo?.isFestival;
  const termLabel = lunarInfo?.isTerm;
  const lunarLabel = lunarInfo?.lunarDay;
  const subLabel = festivalLabel || termLabel || lunarLabel || "";

  return (
    <Pressable
      onPress={() => onPress(dateString)}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: isSelected ? "#A1CEDC" : "transparent",
        minWidth: 36,
      }}
    >
      <ThemedText
        style={{
          fontSize: 14,
          fontWeight: isSelected ? "700" : "500",
          color: state === "disabled" ? "rgba(0,0,0,0.35)" : "#111",
          lineHeight: 18,
        }}
      >
        {date.day}
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 10,
          opacity: festivalLabel || termLabel ? 1 : 0.75,
          color: festivalLabel
            ? "#C0392B"
            : termLabel
            ? "#0E7C86"
            : "rgba(0,0,0,0.7)",
          lineHeight: 12,
        }}
        numberOfLines={1}
      >
        {subLabel}
      </ThemedText>
    </Pressable>
  );
};
