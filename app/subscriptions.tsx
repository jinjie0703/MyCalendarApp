import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  addSubscription,
  CalendarSubscription,
  deleteSubscription,
  getAllSubscriptions,
  initSubscriptionTable,
  syncSubscription,
  updateSubscription,
  validateSubscriptionUrl,
} from "@/lib/subscription";

const COLORS = [
  Colors.light.primary,
  Colors.light.danger,
  Colors.light.success,
  Colors.light.warning,
  "#9B59B6",
  "#1ABC9C",
  "#E91E63",
  "#607D8B",
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<CalendarSubscription[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表单状态
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 监听键盘事件
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // 加载订阅列表
  const loadSubscriptions = async () => {
    try {
      await initSubscriptionTable();
      const subs = await getAllSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error("加载订阅失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, []),
  );

  // 打开添加/编辑弹窗
  const openModal = (subscription?: CalendarSubscription) => {
    if (subscription) {
      setEditingId(subscription.id);
      setFormName(subscription.name);
      setFormUrl(subscription.url);
      setFormColor(subscription.color);
    } else {
      setEditingId(null);
      setFormName("");
      setFormUrl("");
      setFormColor(COLORS[0]);
    }
    setModalVisible(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setFormName("");
    setFormUrl("");
    setFormColor(COLORS[0]);
  };

  // 保存订阅
  const handleSave = async () => {
    if (!formUrl.trim()) {
      Alert.alert("提示", "请输入日历 URL");
      return;
    }

    setIsValidating(true);

    try {
      // 验证 URL
      const validation = await validateSubscriptionUrl(formUrl.trim());

      if (!validation.valid) {
        Alert.alert("验证失败", validation.message);
        return;
      }

      const name = formName.trim() || validation.name || "未命名日历";

      if (editingId) {
        // 更新
        await updateSubscription(editingId, {
          name,
          url: formUrl.trim(),
          color: formColor,
        });
      } else {
        // 添加
        const newSub = await addSubscription({
          name,
          url: formUrl.trim(),
          color: formColor,
          enabled: true,
          syncInterval: 60,
        });

        // 立即同步
        await syncSubscription(newSub);
      }

      await loadSubscriptions();
      closeModal();
      Alert.alert("成功", editingId ? "订阅已更新" : "订阅已添加并同步");
    } catch (error) {
      Alert.alert("错误", String(error));
    } finally {
      setIsValidating(false);
    }
  };

  // 删除订阅
  const handleDelete = (subscription: CalendarSubscription) => {
    Alert.alert(
      "确认删除",
      `确定要删除订阅 "${subscription.name}" 吗？\n关联的事件也会被删除。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            await deleteSubscription(subscription.id);
            await loadSubscriptions();
          },
        },
      ],
    );
  };

  // 同步订阅
  const handleSync = async (subscription: CalendarSubscription) => {
    setIsSyncing(subscription.id);
    try {
      const result = await syncSubscription(subscription);
      Alert.alert(result.success ? "同步成功" : "同步失败", result.message);
      await loadSubscriptions();
    } catch (error) {
      Alert.alert("同步失败", String(error));
    } finally {
      setIsSyncing(null);
    }
  };

  // 切换启用状态
  const handleToggle = async (subscription: CalendarSubscription) => {
    await updateSubscription(subscription.id, {
      enabled: !subscription.enabled,
    });
    await loadSubscriptions();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: Colors.light.primary, dark: "#1D3D47" }}
      headerImage={
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="globe" size={48} color="#fff" />
          </View>
          <ThemedText style={styles.headerTitle}>日历订阅</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            管理您的网络日历订阅
          </ThemedText>
        </View>
      }
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => openModal()} style={styles.addButton}>
            <Ionicons
              name="add-circle"
              size={28}
              color={Colors.light.primary}
            />
          </Pressable>
        </View>

        <ThemedText style={styles.hint}>
          订阅网络日历（如 Google Calendar、Outlook 等的公开日历链接）
        </ThemedText>

        {isLoading ? (
          <ThemedText style={styles.loadingText}>加载中...</ThemedText>
        ) : subscriptions.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="calendar-outline"
                size={52}
                color={Colors.light.primary}
              />
            </View>
            <ThemedText style={styles.emptyText}>暂无订阅</ThemedText>
            <ThemedText style={styles.emptyHint}>
              点击下方按钮添加网络日历
            </ThemedText>
            <Pressable style={styles.emptyButton} onPress={() => openModal()}>
              <Ionicons name="add" size={18} color="#fff" />
              <ThemedText style={styles.emptyButtonText}>添加订阅</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {subscriptions.map((sub) => (
              <ThemedView key={sub.id} style={styles.subscriptionItem}>
                <View style={styles.subscriptionHeader}>
                  <View
                    style={[styles.colorDot, { backgroundColor: sub.color }]}
                  />
                  <View style={styles.subscriptionInfo}>
                    <ThemedText style={styles.subscriptionName}>
                      {sub.name}
                    </ThemedText>
                    <ThemedText
                      style={styles.subscriptionUrl}
                      numberOfLines={1}
                    >
                      {sub.url}
                    </ThemedText>
                    {sub.lastSync && (
                      <View style={styles.lastSyncRow}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={Colors.light.textTertiary}
                        />
                        <ThemedText style={styles.lastSync}>
                          {sub.lastSync}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: sub.enabled
                          ? Colors.light.success + "20"
                          : Colors.light.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        {
                          color: sub.enabled
                            ? Colors.light.success
                            : Colors.light.textTertiary,
                        },
                      ]}
                    >
                      {sub.enabled ? "已启用" : "已禁用"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.subscriptionActions}>
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonSync]}
                    onPress={() => handleSync(sub)}
                    disabled={isSyncing === sub.id}
                  >
                    <Ionicons
                      name={isSyncing === sub.id ? "sync" : "sync-outline"}
                      size={18}
                      color={
                        isSyncing === sub.id
                          ? Colors.light.textTertiary
                          : Colors.light.primary
                      }
                    />
                    <ThemedText
                      style={[
                        styles.actionText,
                        {
                          color:
                            isSyncing === sub.id
                              ? Colors.light.textTertiary
                              : Colors.light.primary,
                        },
                      ]}
                    >
                      {isSyncing === sub.id ? "同步中" : "同步"}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleToggle(sub)}
                  >
                    <Ionicons
                      name={sub.enabled ? "eye" : "eye-off"}
                      size={18}
                      color={
                        sub.enabled
                          ? Colors.light.success
                          : Colors.light.textTertiary
                      }
                    />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => openModal(sub)}
                  >
                    <Ionicons
                      name="pencil"
                      size={18}
                      color={Colors.light.warning}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDelete(sub)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={Colors.light.danger}
                    />
                  </Pressable>
                </View>
              </ThemedView>
            ))}
          </ScrollView>
        )}
      </ThemedView>

      {/* 添加/编辑弹窗 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View
            style={[
              styles.modalContent,
              keyboardHeight > 0 && {
                marginBottom: keyboardHeight,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingId ? "编辑订阅" : "添加订阅"}
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.modalCloseBtn}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors.light.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>日历名称</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="输入日历名称（可选）"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>日历 URL</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/calendar.ics"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={formUrl}
                  onChangeText={setFormUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <ThemedText style={styles.colorLabel}>选择颜色</ThemedText>
              <View style={styles.colorPicker}>
                {COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormColor(color)}
                  >
                    {formColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  isValidating && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isValidating}
              >
                {isValidating && (
                  <Ionicons
                    name="sync"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <ThemedText style={styles.saveButtonText}>
                  {isValidating
                    ? "验证中..."
                    : editingId
                      ? "保存更改"
                      : "添加并同步"}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: Colors.light.background,
  },
  addButton: {
    padding: 8,
  },
  hint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.light.card,
    padding: 14,
    borderRadius: 12,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 40,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  subscriptionItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  subscriptionInfo: {
    flex: 1,
    gap: 4,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  subscriptionUrl: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  lastSyncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  lastSync: {
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  subscriptionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSync: {
    width: "auto",
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.border,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
