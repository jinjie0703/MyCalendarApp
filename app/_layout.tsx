import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { SettingsProvider, useSettings } from "@/hooks/useSettings";
import {
  addNotificationResponseListener,
  requestNotificationPermission,
  scheduleAllEventNotifications,
} from "@/lib/notifications";
import {
  initSubscriptionTable,
  syncAllSubscriptions,
} from "@/lib/subscription";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RootLayoutContent />
    </SettingsProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { settings } = useSettings();

  // 根据设置决定主题
  const effectiveColorScheme =
    settings.themeMode === "system"
      ? colorScheme
      : settings.themeMode === "dark"
      ? "dark"
      : "light";

  // 初始化通知服务和订阅
  useEffect(() => {
    const init = async () => {
      try {
        // 初始化通知（本地通知在 Expo Go 中可用）
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await scheduleAllEventNotifications();
        }
      } catch (error) {
        // Expo Go 中可能会有推送通知相关警告，但不影响本地通知
        console.warn("通知初始化警告:", error);
      }

      // 初始化订阅表并同步
      try {
        await initSubscriptionTable();
        await syncAllSubscriptions();
      } catch (error) {
        console.error("初始化订阅失败:", error);
      }
    };

    init();

    // 监听通知点击，跳转到对应事件
    let subscription: any;
    try {
      subscription = addNotificationResponseListener((eventId, date) => {
        router.push({
          pathname: "/event/edit",
          params: { id: eventId, date },
        });
      });
    } catch (error) {
      console.warn("通知监听器设置失败:", error);
    }

    return () => {
      subscription?.remove?.();
    };
  }, [router]);

  return (
    <ThemeProvider
      value={effectiveColorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        {/* 首页重定向 */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Tab 导航 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 独立页面 */}
        <Stack.Screen name="year" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="subscriptions" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />

        {/* Modals */}
        <Stack.Screen
          name="event/edit"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />

        {/* 404 页面 */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
