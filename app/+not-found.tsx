import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <>
      <Stack.Screen options={{ title: "页面未找到" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.tabIconDefault}
        />
        <Text style={[styles.title, { color: colors.text }]}>页面未找到</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          抱歉，您访问的页面不存在
        </Text>
        <Link href="/(tabs)/calendar" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.tint }]}>
            返回日历首页
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  link: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
