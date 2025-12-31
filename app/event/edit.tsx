import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
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
import {
  addEvent,
  EventType,
  getDb,
  getEventById,
  updateEvent,
} from "@/lib/database";
import {
  cancelEventNotification,
  scheduleEventNotification,
  scheduleRepeatingNotification,
} from "@/lib/notifications";
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

type CategoryKey = (typeof CATEGORIES)[number]["key"]; // UI 分类 key

const categoryToEventType = (k: CategoryKey): EventType => k;

const PLACEHOLDER_MAP: Record<CategoryKey, string> = {
  reminder: "请输入提醒",
  schedule: "请输入日程",
  course: "请输入课程名称",
  countdown: "请输入倒数日",
  birthday: "请输入姓名",
  anniversary: "请输入纪念日",
};

export default function EventEditModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();

  // 是否是编辑模式
  const isEditMode = !!params.id;
  const eventId = params.id;

  const initialDate = useMemo(() => {
    const d = params.date;
    return d && dayjs(d, "YYYY-MM-DD", true).isValid()
      ? d
      : dayjs().format("YYYY-MM-DD");
  }, [params.date]);

  const [category, setCategory] = useState<CategoryKey>("reminder");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(dayjs().format("HH:mm"));
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);

  // 加载现有事件数据（编辑模式）
  useEffect(() => {
    if (isEditMode && eventId) {
      const loadEvent = async () => {
        try {
          const db = getDb();
          const event = await getEventById(db, eventId);
          if (event) {
            setTitle(event.title);
            setStartDate(event.date);
            setStartTime(event.time || dayjs().format("HH:mm"));
            setDescription(event.description || "");
            setCategory(event.type as CategoryKey);
            setRemindOffsetMin(event.remindOffsetMin ?? 0);
            setRepeatRule((event.repeatRule as any) || "none");

            // 解析 payload
            if (event.payload) {
              try {
                const payload = JSON.parse(event.payload);
                if (payload.isAllDay !== undefined)
                  setIsAllDay(payload.isAllDay);
                if (payload.endDate) setEndDate(payload.endDate);
                if (payload.endTime) setEndTime(payload.endTime);
                if (payload.phone) setPhone(payload.phone);
                if (payload.remindLunar !== undefined)
                  setRemindLunar(payload.remindLunar);
              } catch {}
            }
          }
        } catch (err) {
          console.error("加载事件失败:", err);
          Alert.alert("错误", "加载事件失败");
        } finally {
          setIsLoading(false);
        }
      };
      loadEvent();
    }
  }, [isEditMode, eventId]);

  // --- Schedule specific states ---
  const [isAllDay, setIsAllDay] = useState(false);
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState(
    dayjs().add(1, "hour").format("HH:mm")
  );

  // --- Course specific states ---
  const [periods, setPeriods] = useState([
    { startTime: "08:00", endTime: "09:45", repeatRule: "weekly" },
  ]);

  // --- Birthday specific states ---
  const [phone, setPhone] = useState("");

  // --- Anniversary specific states ---
  const [remindLunar, setRemindLunar] = useState(false);

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
    if (!dayjs(startDate, "YYYY-MM-DD", true).isValid()) {
      Alert.alert("提示", "日期格式请使用 YYYY-MM-DD");
      return;
    }
    let finalTime = "";
    if (startTime) {
      const parsedTime = dayjs(startTime, ["H:mm", "HH:mm"], true);
      if (!parsedTime.isValid()) {
        Alert.alert("提示", "时间格式不合法，请重新选择");
        return;
      }
      finalTime = parsedTime.format("HH:mm");
    }

    const selectedCategory = CATEGORIES.find((c) => c.key === category);

    let payload: any = { categoryLabel: selectedCategory?.label };

    switch (category) {
      case "reminder":
        break;
      case "schedule":
        payload = {
          ...payload,
          isAllDay,
          endDate,
          endTime,
        };
        break;
      case "course":
        payload = { ...payload, periods };
        break;
      case "countdown":
        break;
      case "birthday":
        payload = { ...payload, phone };
        break;
      case "anniversary":
        payload = { ...payload, remindLunar };
        break;
    }

    const eventData = {
      title: t,
      date: startDate,
      time: finalTime,
      description,
      color: selectedCategory?.color || "#94A3B8",
      remindOffsetMin,
      repeatRule,
      type: categoryToEventType(category),
      payload: JSON.stringify(payload),
    };

    const db = getDb();
    let savedEvent;

    if (isEditMode && eventId) {
      // 编辑模式：更新现有事件
      await updateEvent(db, eventId, eventData);
      savedEvent = { ...eventData, id: eventId };

      // 先取消旧通知
      await cancelEventNotification(eventId);
    } else {
      // 新建模式
      savedEvent = await addEvent(db, eventData);
    }

    // 安排通知
    try {
      if (repeatRule && repeatRule !== "none") {
        await scheduleRepeatingNotification(savedEvent);
      } else {
        await scheduleEventNotification(savedEvent);
      }
    } catch (e) {
      console.error("安排通知失败:", e);
    }

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
            {isEditMode ? "编辑事件" : "新建事件"}
          </ThemedText>
          <Pressable onPress={onSave} hitSlop={10} disabled={isLoading}>
            <ThemedText style={[styles.navDone, isLoading && { opacity: 0.5 }]}>
              {isLoading ? "加载中..." : "完成"}
            </ThemedText>
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
          placeholder={PLACEHOLDER_MAP[category]}
          placeholderTextColor="#B7B7B7"
          style={styles.titleInput}
        />
        {/* 列表项 */}
        <ThemedView style={styles.list}>
          {/* --- Reminder --- */}
          {category === "reminder" && (
            <>
              <Pressable
                style={styles.listItem}
                onPress={() => setPickerVisible("date")}
              >
                <ThemedText style={styles.listLeft}>日期</ThemedText>
                <View style={styles.listRight}>
                  <ThemedText style={styles.listValue}>
                    {dayjs(startDate, "YYYY-MM-DD", true).format(
                      "YYYY年M月D日"
                    )}
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
                  <ThemedText style={styles.listValue}>
                    {startTime || ""}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
                </View>
              </Pressable>
            </>
          )}

          {/* --- Schedule --- */}
          {category === "schedule" && (
            <>
              <View style={styles.listItem}>
                <ThemedText style={styles.listLeft}>全天事件</ThemedText>
                <View style={styles.listRight}>
                  <Switch value={isAllDay} onValueChange={setIsAllDay} />
                </View>
              </View>

              <Pressable style={styles.listItem} onPress={() => {}}>
                <ThemedText style={styles.listLeft}>开始时间</ThemedText>
                <View style={styles.listRight}>
                  <ThemedText style={styles.listValue}>
                    {`${dayjs(startDate, "YYYY-MM-DD", true).format(
                      "YYYY/MM/DD"
                    )} ${!isAllDay ? startTime : ""}`}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
                </View>
              </Pressable>

              <Pressable style={styles.listItem} onPress={() => {}}>
                <ThemedText style={styles.listLeft}>结束时间</ThemedText>
                <View style={styles.listRight}>
                  <ThemedText style={styles.listValue}>
                    {`${dayjs(endDate, "YYYY-MM-DD", true).format(
                      "YYYY/MM/DD"
                    )} ${!isAllDay ? endTime : ""}`}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
                </View>
              </Pressable>
            </>
          )}

          {/* --- Course --- */}
          {category === "course" && (
            <>
              <View style={styles.listItem}>
                <ThemedText style={styles.listLeft}>上课应用</ThemedText>
                <View style={styles.listRight}>
                  <ThemedText style={styles.listValue}>未设置</ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
                </View>
              </View>
              {periods.map((p, i) => (
                <Pressable key={i} style={styles.listItem}>
                  <ThemedText style={styles.listLeft}>{`时段 ${
                    i + 1
                  }`}</ThemedText>
                  <View style={styles.listRight}>
                    <ThemedText style={styles.listValue}>
                      {`${p.startTime}-${p.endTime}`}
                    </ThemedText>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#B7B7B7"
                    />
                  </View>
                </Pressable>
              ))}
              <Pressable style={styles.listItem}>
                <ThemedText style={{ ...styles.listLeft, color: "#4F7CFF" }}>
                  添加其他时段
                </ThemedText>
              </Pressable>
            </>
          )}

          {/* --- Countdown / Birthday / Anniversary --- */}
          {(category === "countdown" ||
            category === "birthday" ||
            category === "anniversary") && (
            <Pressable
              style={styles.listItem}
              onPress={() => setPickerVisible("date")}
            >
              <ThemedText style={styles.listLeft}>
                {category === "birthday"
                  ? "生日"
                  : category === "anniversary"
                  ? "纪念日"
                  : "日期"}
              </ThemedText>
              <View style={styles.listRight}>
                <ThemedText style={styles.listValue}>
                  {dayjs(startDate, "YYYY-MM-DD", true).format(
                    category === "birthday" ? "M月D日" : "YYYY年M月D日"
                  )}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
              </View>
            </Pressable>
          )}

          {/* --- Shared Fields --- */}

          <Pressable
            style={styles.listItem}
            onPress={() => setPickerVisible("date")}
          >
            <ThemedText style={styles.listLeft}>日期</ThemedText>
            <View style={styles.listRight}>
              <ThemedText style={styles.listValue}>
                {dayjs(startDate, "YYYY-MM-DD", true).format("YYYY年M月D日")}
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
              <ThemedText style={styles.listValue}>
                {startTime || ""}
              </ThemedText>
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
              `${startDate} ${startTime || "00:00"}`,
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
                setStartDate(d.format("YYYY-MM-DD"));
                setPickerVisible(null);
              } else {
                setStartTime(d.format("HH:mm"));
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
          <TextInput value={startDate} onChangeText={setStartDate} />
          <TextInput value={startTime} onChangeText={setStartTime} />
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
