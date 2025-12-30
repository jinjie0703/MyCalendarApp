import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function SettingsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#EFEFEF", dark: "#222" }}
      headerImage={<ThemedView />}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.hint}>
          这里可以放主题切换、默认提醒、日历源管理等设置项。
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hint: {
    opacity: 0.8,
  },
});
