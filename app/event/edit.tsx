import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { addEvent, getDb } from "@/lib/database";
dayjs.extend(customParseFormat);

const CATEGORIES = [
  {
    key: "reminder",
    label: "提醒",
    icon: "notifications-outline",
    color: "#4F7CFF",
  },
  {
    key: "schedule",
    label: "日程",
    icon: "document-text-outline",
    color: "#8B5CF6",
  },
  { key: "course", label: "课程", icon: "calendar-outline", color: "#3B82F6" },
  {
    key: "countdown",
    label: "倒数日",
    icon: "timer-outline",
    color: "#F97316",
  },
  { key: "birthday", label: "生日", icon: "gift-outline", color: "#F59E0B" },
  {
    key: "anniversary",
    label: "纪念日",
    icon: "heart-outline",
    color: "#10B981",
  },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export default function EventEditModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

  const initialDate = useMemo(() => {
    const d = params.date;
    return d && dayjs(d, "YYYY-MM-DD", true).isValid()
      ? d
      : dayjs().format("YYYY-MM-DD");
  }, [params.date]);

  const [category, setCategory] = useState<CategoryKey>("reminder");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(dayjs().format("HH:mm"));
  const [description, setDescription] = useState("");

  // UI 状态：系统时间选择弹窗（iOS/Android 都会走原生）
  const [pickerVisible, setPickerVisible] = useState<null | "date" | "time">(
    null
  );

  // 提醒/重复（先做 UI + 存库）
  const [remindOffsetMin, setRemindOffsetMin] = useState<number>(0);
  const [repeatRule, setRepeatRule] = useState<
    "none" | "daily" | "weekly" | "monthly" | "yearly"
  >("none");
  const [remindModalVisible, setRemindModalVisible] = useState(false);
  const [repeatModalVisible, setRepeatModalVisible] = useState(false);

  const onSave = async () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("提示", "请输入标题");
      return;
    }

    // 基础校验
    if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
      Alert.alert("提示", "日期格式请使用 YYYY-MM-DD");
      return;
    }
    let finalTime = "";
    if (time) {
      const parsedTime = dayjs(time, ["H:mm", "HH:mm"], true);
      if (!parsedTime.isValid()) {
        Alert.alert("提示", "时间格式不合法，请重新选择");
        return;
      }
      finalTime = parsedTime.format("HH:mm");
    }

    const db = getDb();
    const selectedCategory = CATEGORIES.find((c) => c.key === category);
    await addEvent(db, {
      title: t,
      date,
      time: finalTime,
      description,
      color: selectedCategory?.color || "#94A3B8",
      remindOffsetMin,
      repeatRule,
    });

    router.back();
  };

  const remindText = useMemo(() => {
    if (remindOffsetMin === 0) return "任务发生时";
    if (remindOffsetMin === -1) return "不提醒";
    return `提前${remindOffsetMin}分钟`;
  }, [remindOffsetMin]);

  const repeatText = useMemo(() => {
    switch (repeatRule) {
      case "daily":
        return "每天";
      case "weekly":
        return "每周";
      case "monthly":
        return "每月";
      case "yearly":
        return "每年";
      default:
        return "不重复";
    }
  }, [repeatRule]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#FFFFFF", dark: "#000" }}
      headerImage={<ThemedView />}
    >
      <ThemedView style={styles.page}>
        {/* 顶部栏 */}
        <ThemedView style={styles.nav}>
          <Pressable
            onPress={() => router.back()}
            style={styles.navIconBtn}
            hitSlop={10}
          >
            <Ionicons name="close" size={26} color="#111" />
          </Pressable>
          <ThemedText type="title" style={styles.navTitle}>
            新建事件
          </ThemedText>
          <Pressable onPress={onSave} hitSlop={10}>
            <ThemedText style={styles.navDone}>完成</ThemedText>
          </Pressable>
        </ThemedView>
        {/* 分类选择 */}
        <ThemedView style={styles.categoryRow}>
          {CATEGORIES.map((c) => {
            const selected = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={styles.categoryItem}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    { borderColor: c.color },
                    selected && { backgroundColor: `${c.color}1A` },
                  ]}
                >
                  <Ionicons name={c.icon as any} size={22} color={c.color} />
                </View>
                <ThemedText style={styles.categoryLabel}>{c.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
        {/* 标题输入 */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="请输入提醒"
          placeholderTextColor="#B7B7B7"
          style={styles.titleInput}
        />
        {/* 列表项 */}
        <ThemedView style={styles.list}>
          <Pressable
            style={styles.listItem}
            onPress={() => setPickerVisible("date")}
          >
            <ThemedText style={styles.listLeft}>日期</ThemedText>
            <View style={styles.listRight}>
              <ThemedText style={styles.listValue}>
                {dayjs(date, "YYYY-MM-DD", true).format("YYYY年M月D日")}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
            </View>
          </Pressable>

          <Pressable
            style={styles.listItem}
            onPress={() => setPickerVisible("time")}
          >
            <ThemedText style={styles.listLeft}>时间</ThemedText>
            <View style={styles.listRight}>
              <ThemedText style={styles.listValue}>{time || ""}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
            </View>
          </Pressable>

          <Pressable
            style={styles.listItem}
            onPress={() => setRemindModalVisible(true)}
          >
            <ThemedText style={styles.listLeft}>提醒</ThemedText>
            <View style={styles.listRight}>
              <ThemedText style={styles.listValue}>{remindText}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
            </View>
          </Pressable>

          <Pressable
            style={styles.listItem}
            onPress={() => setRepeatModalVisible(true)}
          >
            <ThemedText style={styles.listLeft}>重复</ThemedText>
            <View style={styles.listRight}>
              <ThemedText style={styles.listValue}>{repeatText}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="备注"
            placeholderTextColor="#D0D0D0"
            style={styles.noteInput}
            multiline
          />
        </ThemedView>

        {/* 系统日期/时间选择器（点“时间”后弹出） */}
        {pickerVisible ? (
          <DateTimePicker
            value={dayjs(
              `${date} ${time || "00:00"}`,
              "YYYY-MM-DD HH:mm"
            ).toDate()}
            mode={pickerVisible}
            is24Hour
            onChange={(_, selected) => {
              // Android: 取消时 selected 为 undefined
              if (!selected) {
                setPickerVisible(null);
                return;
              }
              const d = dayjs(selected);
              if (pickerVisible === "date") {
                setDate(d.format("YYYY-MM-DD"));
                setPickerVisible(null);
              } else {
                setTime(d.format("HH:mm"));
                setPickerVisible(null);
              }
            }}
          />
        ) : null}

        {/* 提醒选择 */}
        <Modal
          visible={remindModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRemindModalVisible(false)}
        >
          <Pressable
            style={styles.modalMask}
            onPress={() => setRemindModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>提醒</Text>
            {[
              { label: "不提醒", value: -1 },
              { label: "任务发生时", value: 0 },
              { label: "提前5分钟", value: 5 },
              { label: "提前15分钟", value: 15 },
              { label: "提前30分钟", value: 30 },
              { label: "提前1小时", value: 60 },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.modalItem}
                onPress={() => {
                  setRemindOffsetMin(opt.value);
                  setRemindModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    opt.value === remindOffsetMin && styles.modalItemTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        {/* 重复选择 */}
        <Modal
          visible={repeatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRepeatModalVisible(false)}
        >
          <Pressable
            style={styles.modalMask}
            onPress={() => setRepeatModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>重复</Text>
            {[
              { label: "不重复", value: "none" },
              { label: "每天", value: "daily" },
              { label: "每周", value: "weekly" },
              { label: "每月", value: "monthly" },
              { label: "每年", value: "yearly" },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.modalItem}
                onPress={() => {
                  setRepeatRule(opt.value as any);
                  setRepeatModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    opt.value === repeatRule && styles.modalItemTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        {/* 隐藏字段：保留 date/time state（不显示） */}
        <View style={styles.hidden}>
          <TextInput value={date} onChangeText={setDate} />
          <TextInput value={time} onChangeText={setTime} />
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  modalMask: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EFEFEF",
  },
  modalItemText: {
    fontSize: 16,
    color: "#444",
  },
  modalItemTextActive: {
    color: "#111",
    fontWeight: "700",
  },

  page: {
    paddingTop: 6,
    gap: 14,
  },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navIconBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },
  navDone: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  categoryItem: {
    alignItems: "center",
    gap: 8,
    width: "16.6%",
  },
  categoryIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  categoryLabel: {
    fontSize: 13,
    color: "#6B6B6B",
  },

  titleInput: {
    fontSize: 26,
    fontWeight: "600",
    paddingVertical: 10,
    color: "#111",
  },

  list: {
    gap: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAEAEA",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  listLeft: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  listRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listValue: {
    fontSize: 16,
    color: "#9A9A9A",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EAEAEA",
    marginTop: 2,
  },

  noteInput: {
    paddingVertical: 18,
    fontSize: 18,
    color: "#111",
    minHeight: 120,
    textAlignVertical: "top",
  },

  hidden: {
    position: "absolute",
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
});
