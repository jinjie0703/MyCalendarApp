/**
 * WheelPicker - iOS 风格滚轮选择器组件
 * 使用 react-native-reanimated 实现流畅的滚动动画和吸附效果
 */

import { Colors } from "@/constants/theme";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

/**
 * 滚轮选项数据结构
 */
export interface WheelItem {
  value: string | number;
  label: string;
}

/**
 * WheelPicker 组件属性
 */
export interface WheelPickerProps {
  /** 可选项数组 */
  data: WheelItem[];
  /** 当前选中值 */
  selectedValue: string | number;
  /** 值变化回调 */
  onValueChange: (value: string | number) => void;
  /** 单项高度，默认 44 */
  itemHeight?: number;
  /** 可见项数量，默认 5 */
  visibleItems?: number;
  /** 容器宽度 */
  width?: number;
}

/**
 * WheelPicker ref 方法
 */
export interface WheelPickerRef {
  /** 滚动到指定值 */
  scrollToValue: (value: string | number, animated?: boolean) => void;
}

/**
 * 单个选项组件
 */
interface WheelItemComponentProps {
  item: WheelItem;
  index: number;
  scrollY: { value: number };
  itemHeight: number;
  visibleItems: number;
  colors: typeof Colors.light;
}

const WheelItemComponent: React.FC<WheelItemComponentProps> = React.memo(
  ({ item, index, scrollY, itemHeight, visibleItems, colors }) => {
    const centerOffset = Math.floor(visibleItems / 2);

    const animatedStyle = useAnimatedStyle(() => {
      // 注意：ScrollView 有 paddingVertical = centerOffset * itemHeight
      // contentOffset.y 不包含 padding，因此这里需要把 padding 计入 item 的实际位置
      const itemPosition = index * itemHeight + centerOffset * itemHeight;
      const centerPosition = scrollY.value + centerOffset * itemHeight;
      const distance = Math.abs(itemPosition - centerPosition);
      const maxDistance = centerOffset * itemHeight;

      // 计算透明度 - 距离中心越远越透明
      const opacity = interpolate(
        distance,
        [0, maxDistance],
        [1, 0.3],
        Extrapolation.CLAMP
      );

      // 计算缩放 - 距离中心越远越小
      const scale = interpolate(
        distance,
        [0, maxDistance],
        [1, 0.85],
        Extrapolation.CLAMP
      );

      return {
        opacity,
        transform: [{ scale }],
      };
    });

    const textAnimatedStyle = useAnimatedStyle(() => {
      const itemPosition = index * itemHeight + centerOffset * itemHeight;
      const centerPosition = scrollY.value + centerOffset * itemHeight;
      const distance = Math.abs(itemPosition - centerPosition);

      // 选中项使用更大更粗的字体
      const fontSize = interpolate(
        distance,
        [0, itemHeight],
        [20, 16],
        Extrapolation.CLAMP
      );

      return {
        fontSize,
        color: distance < itemHeight / 2 ? colors.text : colors.textSecondary,
      };
    });

    return (
      <Animated.View
        style={[styles.itemContainer, { height: itemHeight }, animatedStyle]}
      >
        <Animated.Text
          style={[styles.itemText, textAnimatedStyle]}
          numberOfLines={1}
        >
          {item.label}
        </Animated.Text>
      </Animated.View>
    );
  }
);

WheelItemComponent.displayName = "WheelItemComponent";

/**
 * WheelPicker 滚轮选择器组件
 */
const WheelPickerInner = (
  props: WheelPickerProps,
  ref: React.Ref<WheelPickerRef>
) => {
  const {
    data,
    selectedValue,
    onValueChange,
    itemHeight = 44,
    visibleItems = 5,
    width,
  } = props;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const isScrollingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 计算容器高度
  const containerHeight = itemHeight * visibleItems;
  const centerOffset = Math.floor(visibleItems / 2);

  // 查找选中值的索引
  const selectedIndex = useMemo(() => {
    const index = data.findIndex((item) => item.value === selectedValue);
    return index >= 0 ? index : 0;
  }, [data, selectedValue]);

  // 初始化 scrollY 为选中项的位置，确保首次渲染时选中项显示在中心
  const scrollY = useSharedValue(selectedIndex * itemHeight);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number, animated: boolean = true) => {
      const offset = index * itemHeight;
      scrollViewRef.current?.scrollTo({
        y: offset,
        animated,
      });
    },
    [itemHeight]
  );

  // 暴露 ref 方法
  useImperativeHandle(
    ref,
    () => ({
      scrollToValue: (value: string | number, animated: boolean = true) => {
        const index = data.findIndex((item) => item.value === value);
        if (index >= 0) {
          scrollToIndex(index, animated);
        }
      },
    }),
    [data, scrollToIndex]
  );

  // 在布局之前同步设置 scrollY 的初始值
  useLayoutEffect(() => {
    scrollY.value = selectedIndex * itemHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化滚动位置
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // 延迟执行滚动以确保组件已挂载
    const timer = setTimeout(() => {
      scrollToIndex(selectedIndex, false);
    }, 10);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当 selectedValue 从外部改变时，滚动到对应位置
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!isScrollingRef.current) {
      // 同步更新 scrollY 的值，确保选中项显示在中心
      scrollY.value = selectedIndex * itemHeight;
      scrollToIndex(selectedIndex, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, selectedIndex]);

  // 处理值变化
  const handleValueChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        const newValue = data[index].value;
        if (newValue !== selectedValue) {
          onValueChange(newValue);
        }
      }
    },
    [data, selectedValue, onValueChange]
  );

  // 滚动处理器
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 滚动开始
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  // 滚动结束时吸附到最近的项
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = false;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      // 吸附到最近的项
      scrollToIndex(clampedIndex, true);
      handleValueChange(clampedIndex);
    },
    [itemHeight, data.length, scrollToIndex, handleValueChange]
  );

  // 拖拽结束时也需要处理吸附
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const velocity = event.nativeEvent.velocity?.y ?? 0;

      // 如果没有惯性滚动，直接吸附
      if (Math.abs(velocity) < 0.1) {
        isScrollingRef.current = false;
        const index = Math.round(offsetY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
        scrollToIndex(clampedIndex, true);
        handleValueChange(clampedIndex);
      }
    },
    [itemHeight, data.length, scrollToIndex, handleValueChange]
  );

  // 渲染选中指示器
  const renderSelectionIndicator = () => (
    <View
      style={[
        styles.selectionIndicator,
        {
          top: centerOffset * itemHeight,
          height: itemHeight,
          borderTopColor: colors.border,
          borderBottomColor: colors.border,
        },
      ]}
      pointerEvents="none"
    />
  );

  // 渲染顶部和底部渐变遮罩
  const renderGradientOverlay = () => (
    <>
      <View
        style={[
          styles.gradientTop,
          {
            height: centerOffset * itemHeight,
            backgroundColor: colors.surface,
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.gradientBottom,
          {
            height: centerOffset * itemHeight,
            backgroundColor: colors.surface,
          },
        ]}
        pointerEvents="none"
      />
    </>
  );

  return (
    <View
      style={[
        styles.container,
        {
          height: containerHeight,
          width: width,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingVertical: centerOffset * itemHeight,
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={scrollHandler}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="never"
      >
        {data.map((item, index) => (
          <WheelItemComponent
            key={`${item.value}-${index}`}
            item={item}
            index={index}
            scrollY={scrollY}
            itemHeight={itemHeight}
            visibleItems={visibleItems}
            colors={colors}
          />
        ))}
      </Animated.ScrollView>
      {renderSelectionIndicator()}
      {renderGradientOverlay()}
    </View>
  );
};

export const WheelPicker = forwardRef<WheelPickerRef, WheelPickerProps>(
  WheelPickerInner
);

WheelPicker.displayName = "WheelPicker";

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  itemContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    textAlign: "center",
  },
  selectionIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    pointerEvents: "none",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0.7,
    pointerEvents: "none",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.7,
    pointerEvents: "none",
  },
});

export default WheelPicker;
