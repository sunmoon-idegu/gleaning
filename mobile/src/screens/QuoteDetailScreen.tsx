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
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme, FONT_SIZES } from "../context/ThemeContext";
import { apiFetch, type Quote } from "../lib/api";

function sourceLabel(quote: Quote, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  const s = quote.source;
  if (!s) return null;
  if (s.type === "book" && s.book) {
    const parts: string[] = [s.book.title];
    if (s.book.author) parts.push(t("quoteDetail.by", { author: s.book.author }));
    if (quote.page) parts.push(t("quoteDetail.pageRef", { page: quote.page }));
    return parts.join("  ·  ");
  }
  if (s.type === "video") return s.title;
  return null;
}

interface Props {
  quote: Quote;
  onBack: () => void;
  onDelete?: () => void;
}

export default function QuoteDetailScreen({ quote, onBack, onDelete }: Props) {
  const { getToken } = useAuth();
  const { colors, appFontSize } = useTheme();
  const { t } = useTranslation();
  const detailFontSize = FONT_SIZES[appFontSize].detail;
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const src = sourceLabel(quote, t);
  const date = new Date(quote.created_at).toLocaleString(undefined, {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.fg} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={12} disabled={deleting}>
          <Feather name="trash-2" size={18} color={colors.mutedFg} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.quoteText, { color: colors.fg, fontSize: detailFontSize, lineHeight: detailFontSize * 1.75 }]}>
          {quote.text}
        </Text>

        {src && (
          <Text style={[styles.source, { color: colors.mutedFg }]}>{src}</Text>
        )}

        {quote.tags.length > 0 && (
          <View style={styles.tags}>
            {quote.tags.map((t) => (
              <Text
                key={t.id}
                style={[styles.tag, { backgroundColor: colors.muted, color: colors.mutedFg }]}
              >
                {t.name}
              </Text>
            ))}
          </View>
        )}

        <Text style={[styles.date, { color: colors.mutedFg }]}>{date}</Text>
      </ScrollView>

      {/* Actions */}
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 28,
    fontWeight: "400",
    marginBottom: 28,
  },
  source: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  date: {
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});
