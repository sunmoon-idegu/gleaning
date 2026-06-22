import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme, FONT_SIZES } from "../context/ThemeContext";
import { apiFetch, type Quote } from "../lib/api";
import ReflectionsSection from "../components/ReflectionsSection";

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
  const [showMore, setShowMore] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const moreRef = useRef<View>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;

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
    setShowMore(false);
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

  function handleEditFromMore() {
    setShowMore(false);
    setEditing(true);
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
            <TouchableOpacity onPress={handleSaveEdit} style={styles.headerBtn} hitSlop={12} disabled={saving || !editText.trim()}>
              <Text style={[styles.headerBtnText, { color: colors.primary }]}>{t("add.save")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.fg} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleCopy} style={styles.iconBtn} hitSlop={12}>
                <Feather name={copied ? "check" : "copy"} size={18} color={copied ? "#16a34a" : colors.mutedFg} />
              </TouchableOpacity>
              <TouchableOpacity
                ref={moreRef}
                onPress={() => {
                  moreRef.current?.measure((_fx: number, _fy: number, _w: number, h: number, _px: number, py: number) => {
                    setMenuPos({ top: py + h + 4, right: 12 });
                    menuAnim.setValue(0);
                    setShowMore(true);
                    Animated.timing(menuAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
                  });
                }}
                style={styles.iconBtn}
                hitSlop={12}
              >
                <Feather name="more-horizontal" size={20} color={colors.mutedFg} />
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

        <ReflectionsSection targetType="quote" targetId={quote.id} />
      </ScrollView>

      {/* Popup menu */}
      <Modal visible={showMore} transparent animationType="none" onRequestClose={() => setShowMore(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMore(false)}>
          {menuPos && (
            <Animated.View
              style={[styles.menu, {
                top: menuPos.top,
                right: menuPos.right,
                backgroundColor: colors.cardBg,
                opacity: menuAnim,
                transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
              }]}
              onStartShouldSetResponder={() => true}
            >
              <TouchableOpacity
                style={[styles.menuRow, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}
                onPress={handleEditFromMore}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={14} color={colors.fg} />
                <Text style={[styles.menuRowText, { color: colors.fg }]}>{t("quoteDetail.edit")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuRow, { backgroundColor: colors.cardBg, borderBottomWidth: 0 }]}
                onPress={handleDelete}
                activeOpacity={0.7}
                disabled={deleting}
              >
                <Feather name="trash-2" size={14} color="#ef4444" />
                <Text style={[styles.menuRowText, { color: "#ef4444" }]}>{t("quoteDetail.delete")}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
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
  // Popup menu
  menu: {
    position: "absolute",
    width: 140,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuRowText: { fontSize: 15 },
});
