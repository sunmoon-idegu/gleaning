import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRef, useState } from "react";
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type ThemeMode, type SortOrder, type AppFontSize } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import FeedbackScreen from "./FeedbackScreen";

const APP_VERSION = "1.0.0";

function Row({ label, value, colors }: { label: string; value?: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.fg }]}>{label}</Text>
      {value && <Text style={[styles.rowValue, { color: colors.mutedFg }]} numberOfLines={1}>{value}</Text>}
    </View>
  );
}

function SegmentControl<T extends string>({
  options, value, onSelect, colors,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.segBtn, { borderColor: active ? colors.primary : colors.border }, active && { backgroundColor: colors.primary }]}
            onPress={() => onSelect(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segText, { color: active ? colors.primaryFg : colors.mutedFg }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "colorful", label: "Colorful" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "random", label: "Random" },
];

const FONT_OPTIONS: { value: AppFontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export default function SettingsScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { theme, colors, setTheme, sortOrder, setSortOrder, appFontSize, setAppFontSize } = useTheme();
  const { width } = useWindowDimensions();
  const [showFeedback, setShowFeedback] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  function openFeedback() {
    setShowFeedback(true);
    slideAnim.setValue(width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function closeFeedback() {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowFeedback(false));
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "Your account will be permanently deleted in 30 days, including all quotes and data. You will be signed out immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              if (token) await apiFetch("/users/me", token, { method: "DELETE" });
            } catch {
              // proceed to sign out even if request fails
            }
            signOut();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.fg }]}>Settings</Text>

        {/* Account */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Row label="Email" value={user?.primaryEmailAddress?.emailAddress} colors={colors} />
        </View>

        {/* Appearance */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>Appearance</Text>
        <SegmentControl options={THEMES} value={theme} onSelect={setTheme} colors={colors} />

        {/* Feed */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>Feed</Text>
        <Text style={[styles.subLabel, { color: colors.mutedFg }]}>Sort order</Text>
        <SegmentControl options={SORT_OPTIONS} value={sortOrder} onSelect={setSortOrder} colors={colors} />
        <Text style={[styles.subLabel, { color: colors.mutedFg }]}>Text size</Text>
        <SegmentControl options={FONT_OPTIONS} value={appFontSize} onSelect={setAppFontSize} colors={colors} />

        {/* Feedback */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>Support</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: "transparent" }]} onPress={openFeedback} activeOpacity={0.6}>
            <Text style={[styles.rowLabel, { color: colors.fg }]}>Send feedback</Text>
            <Text style={[styles.rowChevron, { color: colors.mutedFg }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>About</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Row label="Version" value={APP_VERSION} colors={colors} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.tagline, { color: colors.mutedFg }]}>Quotes. Keep the best. Nothing else.</Text>
          <Text style={[styles.copyright, { color: colors.mutedFg }]}>© 2025 Gleaning</Text>
        </View>
      </ScrollView>
    </SafeAreaView>

    {showFeedback && (
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}>
        <FeedbackScreen onBack={closeFeedback} />
      </Animated.View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  heading: { fontSize: 22, fontWeight: "600", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  section: { fontSize: 13, fontWeight: "500", paddingHorizontal: 20, paddingBottom: 4, marginTop: 20 },
  subLabel: { fontSize: 12, paddingHorizontal: 20, paddingBottom: 4, marginTop: 10 },
  card: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14, maxWidth: "55%" },
  rowChevron: { fontSize: 22, lineHeight: 26 },
  segmentRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, alignItems: "center" },
  segText: { fontSize: 13, fontWeight: "500" },
  signOutBtn: {
    marginHorizontal: 16, marginTop: 28, padding: 16,
    borderRadius: 12, backgroundColor: "#fee2e2", alignItems: "center",
  },
  signOutText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
  deleteBtn: {
    marginHorizontal: 16, marginTop: 10, padding: 14, alignItems: "center",
  },
  deleteText: { color: "#dc2626", fontSize: 14 },
  footer: { alignItems: "center", paddingTop: 28, paddingBottom: 40, gap: 4 },
  tagline: { fontSize: 13, fontStyle: "italic" },
  copyright: { fontSize: 11 },
});
