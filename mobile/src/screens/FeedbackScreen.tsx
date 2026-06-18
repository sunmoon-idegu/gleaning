import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";

const PRESET_IDS = ["bug", "feature", "unclear", "love", "other"] as const;

interface Props {
  onBack: () => void;
}

export default function FeedbackScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = !!selected || text.trim().length > 0;

  async function handleSubmit() {
    if (!canSend) return;
    setSending(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await apiFetch("/feedback", token, {
        method: "POST",
        body: JSON.stringify({ category: selected, message: text.trim() || null }),
      });
      setSent(true);
    } catch {
      Alert.alert(t("feedback.failedTitle"), t("feedback.failedMessage"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.fg} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.fg }]}>{t("feedback.heading")}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.thanks}>
          <Feather name="check-circle" size={48} color="#16a34a" />
          <Text style={[styles.thanksTitle, { color: colors.fg }]}>{t("feedback.thankYouTitle")}</Text>
          <Text style={[styles.thanksBody, { color: colors.mutedFg }]}>{t("feedback.thankYouBody")}</Text>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onBack}>
            <Text style={[styles.doneText, { color: colors.primaryFg }]}>{t("feedback.done")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
                <Feather name="arrow-left" size={22} color={colors.fg} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.fg }]}>{t("feedback.heading")}</Text>
              <View style={styles.backBtn} />
            </View>

            <View style={styles.body}>
              <Text style={[styles.label, { color: colors.mutedFg }]}>{t("feedback.whatsMind")}</Text>
              <View style={styles.chips}>
                {PRESET_IDS.map((id) => {
                  const active = selected === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.chip,
                        { borderColor: active ? colors.primary : colors.border },
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelected(active ? null : id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.primaryFg : colors.fg }]}>
                        {t(`feedback.${id}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.mutedFg, marginTop: 20 }]}>
                {t("feedback.details")}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.fg },
                ]}
                placeholder={t("feedback.placeholder")}
                placeholderTextColor={colors.mutedFg}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                maxLength={1000}
              />
              <Text style={[styles.charCount, { color: colors.mutedFg }]}>{t("feedback.charCount", { count: text.length })}</Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              (!canSend || sending) && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSend || sending}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitText, { color: colors.primaryFg }]}>
              {sending ? t("feedback.sending") : t("feedback.send")}
            </Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "600" },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 14 },
  textArea: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 15, minHeight: 130, lineHeight: 22,
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
  footer: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitBtn: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontSize: 16, fontWeight: "600" },
  // Thank-you state
  thanks: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  thanksTitle: { fontSize: 22, fontWeight: "600" },
  thanksBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  doneBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  doneText: { fontSize: 16, fontWeight: "600" },
});
