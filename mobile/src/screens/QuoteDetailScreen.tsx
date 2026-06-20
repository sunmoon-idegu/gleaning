import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme, FONT_SIZES } from "../context/ThemeContext";
import { apiFetch, type Quote } from "../lib/api";

function sourceLabel(quote: Quote, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  if (quote.source_type === "book" && quote.book) {
    const parts: string[] = [quote.book.title];
    if (quote.book.author) parts.push(t("quoteDetail.by", { author: quote.book.author }));
    if (quote.page) parts.push(t("quoteDetail.pageRef", { page: quote.page }));
    return parts.join("  ·  ");
  }
  return null;
}

interface Props {
  quote: Quote;
  onBack: () => void;
  onDelete?: () => void;
  onUpdate?: (updated: Quote) => void;
}

export default function QuoteDetailScreen({ quote, onBack, onDelete, onUpdate }: Props) {
  const { getToken } = useAuth();
  const { colors, appFontSize, language } = useTheme();
  const { t } = useTranslation();
  const detailFontSize = FONT_SIZES[appFontSize].detail;
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(quote.text);
  const [saving, setSaving] = useState(false);

  const src = sourceLabel(quote, t);
  const localeMap = { en: "en-US", zh: "zh-TW", ja: "ja-JP" } as const;
  const date = new Date(quote.created_at).toLocaleString(localeMap[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  async function handleCopy() {
    await Clipboard.setStringAsync(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    Alert.alert(
      t("quoteDetail.deleteTitle"),
      t("quoteDetail.deleteMessage"),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("quoteDetail.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await getToken();
              if (!token) return;
              await apiFetch(`/quotes/${quote.id}`, token, { method: "DELETE" });
              onDelete?.();
              onBack();
            } catch {
              Alert.alert(t("add.errorTitle"), t("quoteDetail.deleteFailed"));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (trimmed === quote.text) { setEditing(false); return; }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await apiFetch<Quote>(`/quotes/${quote.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ text: trimmed }),
      });
      onUpdate?.(updated);
      setEditing(false);
    } catch {
      Alert.alert(t("add.errorTitle"), t("quoteDetail.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditText(quote.text);
    setEditing(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        {editing ? (
          <>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.headerBtn} hitSlop={12}>
              <Text style={[styles.headerBtnText, { color: colors.mutedFg }]}>{t("settings.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.headerBtn} hitSlop={12} disabled={saving}>
              <Text style={[styles.headerBtnText, { color: colors.primary }]}>{t("add.save")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.fg} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn} hitSlop={12}>
                <Feather name="edit-2" size={18} color={colors.mutedFg} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} hitSlop={12} disabled={deleting}>
                <Feather name="trash-2" size={18} color={colors.mutedFg} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <TextInput
            style={[styles.editInput, { color: colors.fg, fontSize: detailFontSize, lineHeight: detailFontSize * 1.75, borderColor: colors.border }]}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        ) : (
          <Text style={[styles.quoteText, { color: colors.fg, fontSize: detailFontSize, lineHeight: detailFontSize * 1.75 }]}>
            {quote.text}
          </Text>
        )}

        {src && (
          <Text style={[styles.source, { color: colors.mutedFg }]}>{src}</Text>
        )}

        <Text style={[styles.date, { color: colors.mutedFg }]}>{date}</Text>
      </ScrollView>

      {/* Actions */}
      {!editing && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#16a34a" : colors.fg} />
            <Text style={[styles.actionLabel, { color: copied ? "#16a34a" : colors.fg }]}>
              {copied ? t("quoteDetail.copied") : t("quoteDetail.copy")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  headerBtnText: { fontSize: 16, fontWeight: "500" },
  headerActions: { flexDirection: "row", gap: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  quoteText: { fontSize: 17, lineHeight: 28, fontWeight: "400", marginBottom: 28 },
  editInput: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  source: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  date: { fontSize: 13, marginTop: 4 },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: "500" },
});
