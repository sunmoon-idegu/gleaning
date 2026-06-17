import { useAuth, useUser } from "@clerk/clerk-expo";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type ThemeMode, type FeedMode } from "../context/ThemeContext";

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "colorful", label: "Colorful" },
];

const FEED_MODES: { value: FeedMode; label: string }[] = [
  { value: "list", label: "List" },
  { value: "card", label: "Card" },
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { theme, colors, setTheme, feedMode, setFeedMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text style={[styles.heading, { color: colors.fg }]}>Settings</Text>

      {/* Account */}
      <Text style={[styles.section, { color: colors.mutedFg }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.fg }]}>Email</Text>
          <Text style={[styles.value, { color: colors.mutedFg }]} numberOfLines={1}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>

      {/* Appearance */}
      <Text style={[styles.section, { color: colors.mutedFg }]}>Appearance</Text>
      <View style={styles.themeRow}>
        {THEMES.map(({ value, label }) => {
          const active = theme === value;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.themeBtn,
                { borderColor: active ? colors.primary : colors.border },
                active && { backgroundColor: colors.primary },
              ]}
              onPress={() => setTheme(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeBtnText, { color: active ? colors.primaryFg : colors.mutedFg }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed */}
      <Text style={[styles.section, { color: colors.mutedFg }]}>Feed</Text>
      <View style={styles.themeRow}>
        {FEED_MODES.map(({ value, label }) => {
          const active = feedMode === value;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.themeBtn,
                { borderColor: active ? colors.primary : colors.border },
                active && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFeedMode(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeBtnText, { color: active ? colors.primaryFg : colors.mutedFg }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      {/* Copyright */}
      <Text style={[styles.copyright, { color: colors.mutedFg }]}>© 2025 Gleaning</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 22, fontWeight: "600", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  section: {
    fontSize: 13,
    fontWeight: "500",
    paddingHorizontal: 20,
    paddingBottom: 6,
    marginTop: 16,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  label: { fontSize: 15 },
  value: { fontSize: 14, maxWidth: "60%" },
  themeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  themeBtnText: { fontSize: 13, fontWeight: "500" },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
  },
  signOutText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
  copyright: { fontSize: 12, textAlign: "center", marginTop: 32 },
});
