import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import { apiFetch, type BookWithQuotes, type Quote } from "../lib/api";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import { ApiError } from "../lib/api";
import ReflectionsSection from "../components/ReflectionsSection";

const LANG_OPTIONS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
];

function QuoteItem({ quote, colors }: { quote: Quote; colors: ThemeColors }) {
  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      <Text style={[styles.quoteText, { color: colors.fg }]}>{quote.text}</Text>
    </View>
  );
}

interface BookDetailProps {
  bookId: string;
  onBack: () => void;
  onDelete?: () => void;
}

export default function BookDetail({ bookId, onBack, onDelete }: BookDetailProps) {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [book, setBook] = useState<BookWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editLang, setEditLang] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const moreRef = useRef<View>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    setError(false);
    setBook(null);
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<BookWithQuotes>(`/books/${bookId}`, token);
        setBook(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  function handleDeleteBook() {
    if (!book) return;
    Alert.alert(
      t("shelf.deleteBookTitle"),
      t("shelf.deleteBookMessage", { count: book.quotes.length }),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("shelf.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await getToken();
              if (!token) return;
              await apiFetch(`/books/${bookId}`, token, { method: "DELETE" });
              onDelete?.();
              onBack();
            } catch {
              Alert.alert(t("add.errorTitle"), t("shelf.deleteBookFailed"));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function openEdit() {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthor(book.author ?? "");
    setEditLang(book.language ?? "");
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    if (!editTitle.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error();
      const updated = await apiFetch<BookWithQuotes>(`/books/${bookId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          author: editAuthor.trim() || null,
          language: editLang || null,
        }),
      });
      setBook((prev) => prev ? { ...prev, title: updated.title, author: updated.author, language: updated.language } : prev);
      setShowEdit(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert(t("add.errorTitle"), t("shelf.duplicateTitle"));
      } else {
        Alert.alert(t("add.errorTitle"), t("shelf.couldNotAdd"));
      }
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.mutedFg }}>{t("shelf.failedToLoad")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.fg} />
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

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.heading, { color: colors.fg }]}>{book.title}</Text>
        {book.author && (
          <Text style={[styles.subheading, { color: colors.mutedFg }]}>{book.author}</Text>
        )}
        <Text style={[styles.count, { color: colors.mutedFg }]}>
          {t("shelf.quoteCount", { count: book.quotes.length })}
        </Text>
        {book.quotes.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedFg }]}>
            {t("shelf.noQuotesFromBook")}
          </Text>
        ) : (
          book.quotes.map((q) => <QuoteItem key={q.id} quote={q} colors={colors} />)
        )}

        <ReflectionsSection targetType="book" targetId={bookId} />
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
                onPress={() => { setShowMore(false); openEdit(); }}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={14} color={colors.fg} />
                <Text style={[styles.menuRowText, { color: colors.fg }]}>{t("quoteDetail.edit")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuRow, { backgroundColor: colors.cardBg, borderBottomWidth: 0 }]}
                onPress={() => { setShowMore(false); handleDeleteBook(); }}
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

      {/* Edit modal */}
      <Modal
        visible={showEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEdit(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEdit(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.fg }]}>{t("shelf.editBook")}</Text>

            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder={t("shelf.titlePlaceholder")}
              placeholderTextColor={colors.mutedFg}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
              value={editAuthor}
              onChangeText={setEditAuthor}
              placeholder={t("shelf.authorPlaceholder")}
              placeholderTextColor={colors.mutedFg}
            />

            <Text style={[styles.modalLabel, { color: colors.mutedFg }]}>{t("shelf.languageLabel")}</Text>
            <View style={styles.langRow}>
              {LANG_OPTIONS.map((opt) => {
                const active = editLang === opt.code;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    style={[
                      styles.langChip,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setEditLang(active ? "" : opt.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langChipText, { color: active ? colors.primaryFg : colors.mutedFg }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]}
                onPress={() => setShowEdit(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedFg }]}>{t("settings.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }, (!editTitle.trim() || editSaving) && styles.modalBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={!editTitle.trim() || editSaving}
              >
                {editSaving
                  ? <ActivityIndicator size="small" color={colors.primaryFg} />
                  : <Text style={[styles.modalBtnText, { color: colors.primaryFg }]}>{t("add.save")}</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  iconBtn: { padding: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },
  heading: { fontSize: 22, fontWeight: "600", marginBottom: 4 },
  subheading: { fontSize: 15, marginBottom: 4 },
  count: { fontSize: 13, marginBottom: 20 },
  empty: { fontSize: 14, marginTop: 12 },
  card: { paddingVertical: 24, borderBottomWidth: 1 },
  quoteText: { fontSize: 16, lineHeight: 26 },
  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  modalContent: { borderRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  modalLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  langChipText: { fontSize: 13, fontWeight: "500" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  modalBtnCancel: { borderWidth: 1 },
  modalBtnDisabled: { opacity: 0.4 },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
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
