import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export type ActionMenuItem = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  items: ActionMenuItem[];

  /**
   * Anchor position in screen coordinates (px).
   * Usually from a header button via measureInWindow.
   */
  anchor?: { x: number; y: number; width: number; height: number } | null;

  /**
   * Menu width; default 220.
   */
  width?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionMenu({
  visible,
  onRequestClose,
  items,
  anchor,
  width = 220,
}: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(0, {
        duration: 160,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, progress]);

  const placement = useMemo(() => {
    const pad = 10;
    const a = anchor;

    // Fallback: top-right-ish
    const fallback = {
      left: Math.max(pad, screenW - width - pad),
      top: 72,
      originX: Math.max(pad, screenW - width - pad) + width - 18,
      originY: 72,
    };

    if (!a) return fallback;

    const preferredLeft = a.x + a.width - width;
    const left = Math.min(Math.max(pad, preferredLeft), screenW - width - pad);

    const preferredTop = a.y + a.height + 8;
    const maxTop = screenH - pad - 10; // allow menu to overflow with scroll if needed later
    const top = Math.min(Math.max(pad, preferredTop), maxTop);

    // transform origin near the anchor (top-right corner of menu)
    const originX = Math.min(left + width - 18, screenW - pad);
    const originY = top;

    return { left, top, originX, originY };
  }, [anchor, screenH, screenW, width]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.92, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [-6, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress.value,
      transform: [
        { translateX: placement.originX },
        { translateY: placement.originY },
        { translateX: -placement.originX },
        { translateY: -placement.originY },
        { scale },
        { translateY },
      ],
    };
  }, [placement.originX, placement.originY]);

  const closeWithAnim = () => {
    progress.value = withTiming(
      0,
      { duration: 160, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onRequestClose)();
      }
    );
  };

  // Avoid mounting Modal when not visible AND animation already at 0
  const shouldShow = visible || progress.value > 0.001;
  if (!shouldShow) return null;

  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      onRequestClose={closeWithAnim}
    >
      <View style={styles.root}>
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          onPress={closeWithAnim}
        />

        <Animated.View
          style={[
            styles.cardWrapper,
            { left: placement.left, top: placement.top, width },
            cardStyle,
          ]}
        >
          <ThemedView style={styles.card}>
            {items.map((it, idx) => {
              const isLast = idx === items.length - 1;
              return (
                <Pressable
                  key={it.key}
                  disabled={it.disabled}
                  onPress={() => {
                    // Close first, then call handler
                    closeWithAnim();
                    it.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && !it.disabled ? styles.itemPressed : null,
                    it.disabled ? styles.itemDisabled : null,
                    !isLast ? styles.itemDivider : null,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.itemText,
                      it.destructive ? styles.destructiveText : null,
                      it.disabled ? styles.disabledText : null,
                    ]}
                  >
                    {it.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  cardWrapper: {
    position: "absolute",
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    // shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    // elevation (Android)
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  itemPressed: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
  },
  destructiveText: {
    color: "#C0392B",
  },
  disabledText: {
    color: "rgba(0,0,0,0.55)",
  },
});

