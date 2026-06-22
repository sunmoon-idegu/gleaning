import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";

interface Reflection {
  id: string;
  target_type: string;
  target_id: string;
  content: string;
  created_at: string;
}

interface Props {
  targetType: "quote" | "book";
  targetId: string;
}

export default function ReflectionsSection({ targetType, targetId }: Props) {
  const { getToken } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<string | null>(null); // "new" | id | null
  const [modalText, setModalText] = useState("");
  const [actionId, setActionId] = useState<string | null>(null); // long-press action sheet

  const localeMap = { en: "en-US", zh: "zh-TW", ja: "ja-JP" } as const;
  const dateLocale = localeMap[i18n.language as keyof typeof localeMap] ?? "en-US";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<Reflection[]>(
          `/reflections?target_type=${targetType}&target_id=${targetId}`,
          token,
        );
        if (!cancelled) setReflections(data);
      } catch {
        // show empty on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetType, targetId]);

  function openAdd() { setModalText(""); setModalTarget("new"); }
  function closeModal() { setModalTarget(null); setModalText(""); }

  function openEdit(r: Reflection) {
    setActionId(null);
    setModalText(r.content);
    setModalTarget(r.id);
  }

  async function handleSave() {
    if (!modalText.trim()) { closeModal(); return; }
    const content = modalText.trim();
    const isNew = modalTarget === "new";
    const editId = isNew ? null : modalTarget;
    closeModal();

    if (isNew) {
      const tempId = `temp-${Date.now()}`;
      const tempEntry: Reflection = {
        id: tempId,
        target_type: targetType,
        target_id: targetId,
        content,
        created_at: new Date().toISOString(),
      };
      setReflections((prev) => [tempEntry, ...prev]);
      try {
        const token = await getToken();
        if (!token) { setReflections((prev) => prev.filter((r) => r.id !== tempId)); return; }
        const created = await apiFetch<Reflection>("/reflections", token, {
          method: "POST",
          body: JSON.stringify({ target_type: targetType, target_id: targetId, content }),
        });
        setReflections((prev) => prev.map((r) => r.id === tempId ? created : r));
      } catch {
        setReflections((prev) => prev.filter((r) => r.id !== tempId));
      }
    } else if (editId) {
      setReflections((prev) => prev.map((r) => r.id === editId ? { ...r, content } : r));
      try {
        const token = await getToken();
        if (!token) return;
        const updated = await apiFetch<Reflection>(`/reflections/${editId}`, token, {
          method: "PATCH",
          body: JSON.stringify({ content }),
        });
        setReflections((prev) => prev.map((r) => r.id === editId ? updated : r));
      } catch {
        // optimistic stays
      }
    }
  }

  async function handleDelete() {
    const id = actionId;
    setActionId(null);
    if (!id) return;
    setReflections((prev) => prev.filter((r) => r.id !== id));
    try {
      const token = await getToken();
      if (!token) return;
      await apiFetch(`/reflections/${id}`, token, { method: "DELETE" });
    } catch {
      // optimistic stays
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" });
  }

  const isPending = (id: string) => id.startsWith("temp-");
  const actionReflection = reflections.find((r) => r.id === actionId);

  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.mutedFg }]}>{t("reflections.heading")}</Text>
        <TouchableOpacity onPress={openAdd} hitSlop={12}>
          <Feather name="plus" size={18} color={colors.mutedFg} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <View style={[styles.skeletonLine, { width: "75%", backgroundColor: colors.border }]} />
          <View style={[styles.skeletonLine, { width: "50%", backgroundColor: colors.border, marginTop: 10 }]} />
        </View>
      ) : reflections.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedFg }]}>{t("reflections.empty")}</Text>
      ) : null}

      {reflections.map((r) =>
        isPending(r.id) ? (
          <View key={r.id} style={[styles.entry, { borderTopColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.mutedFg} />
          </View>
        ) : (
          <TouchableOpacity
            key={r.id}
            style={[styles.entry, { borderTopColor: colors.border }]}
            onLongPress={() => setActionId(r.id)}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <Text style={[styles.content, { color: colors.fg }]}>{r.content}</Text>
            <Text style={[styles.date, { color: colors.mutedFg }]}>{formatDate(r.created_at)}</Text>
          </TouchableOpacity>
        )
      )}

      {/* Long-press action sheet */}
      <Modal visible={actionId !== null} transparent animationType="fade" onRequestClose={() => setActionId(null)}>
        <Pressable style={styles.actionOverlay} onPress={() => setActionId(null)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: colors.cardBg }]}>
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.border }]}
              onPress={() => actionReflection && openEdit(actionReflection)}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={16} color={colors.fg} />
              <Text style={[styles.actionRowText, { color: colors.fg }]}>{t("quoteDetail.edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={16} color="#ef4444" />
              <Text style={[styles.actionRowText, { color: "#ef4444" }]}>{t("quoteDetail.delete")}</Text>
            </TouchableOpacity>
          </Pressable>
          <Pressable style={[styles.actionCancel, { backgroundColor: colors.cardBg }]} onPress={() => setActionId(null)}>
            <Text style={[styles.actionCancelText, { color: colors.fg }]}>{t("settings.cancel")}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add / Edit modal */}
      <Modal visible={modalTarget !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <View
                style={[styles.sheet, { backgroundColor: colors.cardBg }]}
                onStartShouldSetResponder={() => true}
              >
                <TextInput
                  autoFocus
                  multiline
                  scrollEnabled
                  value={modalText}
                  onChangeText={setModalText}
                  placeholder={t("reflections.placeholder")}
                  placeholderTextColor={colors.mutedFg}
                  style={[styles.textarea, { color: colors.fg, borderColor: colors.border, backgroundColor: colors.bg }]}
                  textAlignVertical="top"
                />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]} onPress={closeModal}>
                    <Text style={[styles.modalBtnText, { color: colors.mutedFg }]}>{t("reflections.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary }, !modalText.trim() && styles.modalBtnDisabled]}
                    onPress={handleSave}
                    disabled={!modalText.trim()}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.primaryFg }]}>{t("reflections.save")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heading: { fontSize: 13, fontWeight: "500" },
  empty: { fontSize: 14 },
  skeletonWrap: {},
  skeletonLine: { height: 12, borderRadius: 6, opacity: 0.4 },
  entry: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  content: { fontSize: 15, lineHeight: 24, marginBottom: 6 },
  date: { fontSize: 12 },
  // Long-press action sheet
  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 36,
    gap: 10,
  },
  actionSheet: { borderRadius: 16, overflow: "hidden" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionRowText: { fontSize: 16 },
  actionCancel: { borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  actionCancelText: { fontSize: 16, fontWeight: "600" },
  // Add/edit modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    maxHeight: 200,
    lineHeight: 22,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  modalBtnCancel: { borderWidth: 1 },
  modalBtnDisabled: { opacity: 0.4 },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
});
