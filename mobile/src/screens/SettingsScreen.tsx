import { useAuth, useUser } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { useRef, useState } from "react";
import { Alert, Animated, Easing, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme, type ThemeMode, type SortOrder, type AppFontSize, type AppLanguage } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import FeedbackScreen from "./FeedbackScreen";

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


export default function SettingsScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { theme, colors, setTheme, sortOrder, setSortOrder, appFontSize, setAppFontSize, language, setLanguage } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
    { value: "colorful", label: t("settings.themeColorful") },
  ];
  const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
    { value: "newest", label: t("settings.sortNewest") },
    { value: "oldest", label: t("settings.sortOldest") },
    { value: "random", label: t("settings.sortRandom") },
  ];
  const FONT_OPTIONS: { value: AppFontSize; label: string }[] = [
    { value: "small", label: t("settings.sizeSmall") },
    { value: "medium", label: t("settings.sizeMedium") },
    { value: "large", label: t("settings.sizeLarge") },
  ];
  const LANG_OPTIONS: { value: AppLanguage; label: string }[] = [
    { value: "en", label: t("settings.langEn") },
    { value: "zh", label: t("settings.langZh") },
    { value: "ja", label: t("settings.langJa") },
  ];
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

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        (gs.moveX - gs.dx) < width * 0.35 && Math.abs(gs.dx) > Math.abs(gs.dy) && gs.dx > 8,
      onPanResponderMove: (_e, gs) => {
        if (gs.dx > 0) slideAnim.setValue(gs.dx);
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > width * 0.45 || gs.vx > 0.8) {
          closeFeedback();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function handleDeleteAccount() {
    Alert.alert(
      t("settings.deleteTitle"),
      t("settings.deleteMessage"),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("settings.deleteConfirm"),
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
        <Text style={[styles.heading, { color: colors.fg }]}>{t("settings.heading")}</Text>

        {/* Account */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>{t("settings.account")}</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Row label={t("settings.email")} value={user?.primaryEmailAddress?.emailAddress} colors={colors} />
        </View>

        {/* Appearance */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>{t("settings.appearance")}</Text>
        <SegmentControl options={THEMES} value={theme} onSelect={setTheme} colors={colors} />

        {/* Feed */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>{t("settings.feed")}</Text>
        <Text style={[styles.subLabel, { color: colors.mutedFg }]}>{t("settings.sortOrder")}</Text>
        <SegmentControl options={SORT_OPTIONS} value={sortOrder} onSelect={setSortOrder} colors={colors} />
        <Text style={[styles.subLabel, { color: colors.mutedFg }]}>{t("settings.textSize")}</Text>
        <SegmentControl options={FONT_OPTIONS} value={appFontSize} onSelect={setAppFontSize} colors={colors} />

        {/* Language */}
        <Text style={[styles.subLabel, { color: colors.mutedFg }]}>{t("settings.language")}</Text>
        <SegmentControl options={LANG_OPTIONS} value={language} onSelect={setLanguage} colors={colors} />

        {/* Feedback */}
        <Text style={[styles.section, { color: colors.mutedFg }]}>{t("settings.support")}</Text>
        <TouchableOpacity
          style={[styles.card, styles.feedbackRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={openFeedback}
          activeOpacity={0.6}
        >
          <Text style={[styles.rowLabel, { color: colors.fg }]}>{t("settings.sendFeedback")}</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedFg} />
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.muted }]} onPress={() => signOut()} activeOpacity={0.7}>
          <Text style={[styles.signOutText, { color: colors.fg }]}>{t("settings.signOut")}</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={[styles.deleteBtn, { borderColor: "#dc2626" }]} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={styles.deleteText}>{t("settings.deleteAccount")}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.tagline, { color: colors.mutedFg }]}>{t("settings.tagline")}</Text>
          <Text style={[styles.copyright, { color: colors.mutedFg }]}>{t("settings.copyright")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>

    {showFeedback && (
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}
        {...swipeResponder.panHandlers}
      >
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
    borderRadius: 12, alignItems: "center",
  },
  signOutText: { fontWeight: "600", fontSize: 15 },
  deleteBtn: {
    marginHorizontal: 16, marginTop: 10, padding: 14, alignItems: "center",
    borderRadius: 12, borderWidth: 1,
  },
  deleteText: { color: "#dc2626", fontSize: 14 },
  feedbackRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  footer: { alignItems: "center", paddingTop: 28, paddingBottom: 40, gap: 4 },
  tagline: { fontSize: 13, fontStyle: "italic" },
  copyright: { fontSize: 11 },
});
