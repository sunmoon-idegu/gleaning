import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, type Book } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import BookDetail from "./BookDetailScreen";

const LANG_ORDER = ["en", "zh", "ja", "ko", "fr", "de", "es", "pt", "it", "ru"];
const LANG_LABELS: Record<string, string> = {
  en: "English", zh: "Chinese", ja: "Japanese", ko: "Korean",
  fr: "French", de: "German", es: "Spanish", pt: "Portuguese",
  it: "Italian", ru: "Russian",
};

function langLabel(code: string) {
  return LANG_LABELS[code] ?? "Other";
}

function groupByLanguage(books: Book[]): { title: string; data: Book[] }[] {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    const key = book.language ?? "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(book);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ai = LANG_ORDER.indexOf(a);
      const bi = LANG_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map(([code, data]) => ({ title: langLabel(code), data }));
}

export default function ShelfScreen() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newLang, setNewLang] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBooks() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<Book[]>("/books", token);
      setBooks(data.sort((a, b) => a.title.localeCompare(b.title)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBooks(); }, []);

  async function handleAddBook() {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const book = await apiFetch<Book>("/books", token, {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          author: newAuthor.trim() || null,
          language: newLang.trim() || null,
        }),
      });
      setBooks((prev) => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)));
      setShowAddModal(false);
      setNewTitle(""); setNewAuthor(""); setNewLang("");
    } catch {
      Alert.alert("Error", "Could not add book. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (selectedBookId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <BookDetail bookId={selectedBookId} onBack={() => setSelectedBookId(null)} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const sections = groupByLanguage(books);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.fg }]}>Shelf</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.muted }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        contentContainerStyle={books.length === 0 ? styles.emptyContainer : styles.list}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeaderWrap, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
            <Text style={[styles.sectionHeader, { color: colors.fg }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isLast = index === section.data.length - 1;
          return (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: isLast ? "transparent" : colors.border }]}
              onPress={() => setSelectedBookId(item.id)}
              activeOpacity={0.6}
            >
              <View style={styles.rowContent}>
                <Text style={[styles.title, { color: colors.fg }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.author && (
                  <Text style={[styles.author, { color: colors.mutedFg }]} numberOfLines={1}>
                    {item.author}
                  </Text>
                )}
              </View>
              <Text style={[styles.chevron, { color: colors.mutedFg }]}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedFg }]}>
            No books yet. Tap + to add one.
          </Text>
        }
        stickySectionHeadersEnabled={false}
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => { setShowAddModal(false); setNewTitle(""); setNewAuthor(""); setNewLang(""); }}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.fg }]}>Add Book</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Title *"
              placeholderTextColor={colors.mutedFg}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
              value={newAuthor}
              onChangeText={setNewAuthor}
              placeholder="Author (optional)"
              placeholderTextColor={colors.mutedFg}
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
              value={newLang}
              onChangeText={setNewLang}
              placeholder="Language code: en, zh, fr…"
              placeholderTextColor={colors.mutedFg}
              autoCapitalize="none"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]}
                onPress={() => { setShowAddModal(false); setNewTitle(""); setNewAuthor(""); setNewLang(""); }}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedFg }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }, (!newTitle.trim() || saving) && styles.modalBtnDisabled]}
                onPress={handleAddBook}
                disabled={!newTitle.trim() || saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.primaryFg} />
                  : <Text style={[styles.modalBtnText, { color: colors.primaryFg }]}>Add</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "600" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 15 },
  sectionHeaderWrap: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  sectionHeader: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: { flex: 1 },
  title: { fontSize: 15, fontWeight: "500", lineHeight: 21 },
  author: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 22, marginLeft: 8, lineHeight: 26 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnCancel: { borderWidth: 1 },
  modalBtnDisabled: { opacity: 0.4 },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
});
