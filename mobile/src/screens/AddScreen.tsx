import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { apiFetch, ApiError, type Book, type Quote } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const CORNER_HIT = 26;
const HANDLE_SIZE = 13;

function detectLang(text: string): "en" | "zh" | "ja" | null {
  if (/[぀-ゟ゠-ヿ]/.test(text)) return "ja";
  if (/[一-鿿㐀-䶿]/.test(text)) return "zh";
  if (/[a-zA-Z]/.test(text)) return "en";
  return null;
}

interface AddScreenProps {
  onAdded?: () => void;
}

function toNormalized(
  drag: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number,
  layout: { width: number; height: number }
): { x: number; y: number; w: number; h: number } {
  const imgRatio = imgW / imgH;
  const viewRatio = layout.width / layout.height;
  let iw: number, ih: number, ox: number, oy: number;
  if (imgRatio > viewRatio) {
    iw = layout.width;
    ih = layout.width / imgRatio;
    ox = 0;
    oy = (layout.height - ih) / 2;
  } else {
    iw = layout.height * imgRatio;
    ih = layout.height;
    ox = (layout.width - iw) / 2;
    oy = 0;
  }
  const nx = Math.max(0, (drag.x - ox) / iw);
  const ny = Math.max(0, (drag.y - oy) / ih);
  const nw = Math.min(1 - nx, drag.w / iw);
  const nh = Math.min(1 - ny, drag.h / ih);
  return { x: nx, y: ny, w: Math.max(0, nw), h: Math.max(0, nh) };
}

export default function AddScreen({ onAdded }: AddScreenProps) {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [text, setText] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [page, setPage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  const [annotImage, setAnnotImage] = useState<{ uri: string; base64: string; iw: number; ih: number } | null>(null);
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [annotLayout, setAnnotLayout] = useState<{ width: number; height: number } | null>(null);

  const dragRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const annotLayoutRef = useRef<{ width: number; height: number } | null>(null);
  const gestureMode = useRef<"draw" | "move" | "resize">("draw");
  const resizeAnchorPt = useRef<{ x: number; y: number } | null>(null);
  const moveOrigin = useRef<{ bx: number; by: number } | null>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: tx, locationY: ty } = e.nativeEvent;
        const rect = dragRectRef.current;

        if (rect && rect.w > 10 && rect.h > 10) {
          const corners = [
            { px: rect.x,          py: rect.y,          ax: rect.x + rect.w, ay: rect.y + rect.h },
            { px: rect.x + rect.w, py: rect.y,          ax: rect.x,          ay: rect.y + rect.h },
            { px: rect.x,          py: rect.y + rect.h, ax: rect.x + rect.w, ay: rect.y          },
            { px: rect.x + rect.w, py: rect.y + rect.h, ax: rect.x,          ay: rect.y          },
          ];
          for (const c of corners) {
            if (Math.hypot(tx - c.px, ty - c.py) < CORNER_HIT) {
              gestureMode.current = "resize";
              resizeAnchorPt.current = { x: c.ax, y: c.ay };
              startPt.current = { x: c.px, y: c.py };
              return;
            }
          }
          if (
            tx >= rect.x - 8 && tx <= rect.x + rect.w + 8 &&
            ty >= rect.y - 8 && ty <= rect.y + rect.h + 8
          ) {
            gestureMode.current = "move";
            moveOrigin.current = { bx: rect.x, by: rect.y };
            return;
          }
        }

        gestureMode.current = "draw";
        startPt.current = { x: tx, y: ty };
        dragRectRef.current = { x: tx, y: ty, w: 0, h: 0 };
        setDragRect({ x: tx, y: ty, w: 0, h: 0 });
      },
      onPanResponderMove: (_e, gestureState) => {
        const { dx, dy } = gestureState;

        if (gestureMode.current === "draw" && startPt.current) {
          const r = {
            x: Math.min(startPt.current.x, startPt.current.x + dx),
            y: Math.min(startPt.current.y, startPt.current.y + dy),
            w: Math.abs(dx),
            h: Math.abs(dy),
          };
          dragRectRef.current = r;
          setDragRect(r);
        } else if (gestureMode.current === "move" && moveOrigin.current) {
          const layout = annotLayoutRef.current;
          const rect = dragRectRef.current!;
          const maxX = layout ? layout.width - rect.w : 9999;
          const maxY = layout ? layout.height - rect.h : 9999;
          const r = {
            x: Math.max(0, Math.min(maxX, moveOrigin.current.bx + dx)),
            y: Math.max(0, Math.min(maxY, moveOrigin.current.by + dy)),
            w: rect.w,
            h: rect.h,
          };
          dragRectRef.current = r;
          setDragRect(r);
        } else if (gestureMode.current === "resize" && resizeAnchorPt.current && startPt.current) {
          const activeCx = startPt.current.x + dx;
          const activeCy = startPt.current.y + dy;
          const a = resizeAnchorPt.current;
          const r = {
            x: Math.min(a.x, activeCx),
            y: Math.min(a.y, activeCy),
            w: Math.abs(activeCx - a.x),
            h: Math.abs(activeCy - a.y),
          };
          dragRectRef.current = r;
          setDragRect(r);
        }
      },
      onPanResponderRelease: () => {
        startPt.current = null;
        gestureMode.current = "draw";
        resizeAnchorPt.current = null;
        moveOrigin.current = null;
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<Book[]>("/books", token);
      setBooks(data);
    })();
  }, []);

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );

  useEffect(() => {
    if (filteredBooks.length > 0 && sourceOpen) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [filteredBooks.length, bookSearch]);

  async function captureFromImage(fromCamera: boolean) {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("add.permissionRequired"), t("add.permissionCamera"));
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("add.permissionRequired"), t("add.permissionLibrary"));
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4, base64: true });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    const asset = result.assets[0];
    setAnnotImage({
      uri: asset.uri,
      base64: asset.base64!,
      iw: asset.width ?? 1,
      ih: asset.height ?? 1,
    });
    dragRectRef.current = null;
    setDragRect(null);
  }

  async function sendToOCR(b64: string, selection: { x: number; y: number; w: number; h: number } | null) {
    setExtracting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const token = await getToken();
      const body: Record<string, unknown> = { image: b64 };
      if (selection) {
        body.selection_x = selection.x;
        body.selection_y = selection.y;
        body.selection_w = selection.w;
        body.selection_h = selection.h;
      }
      const res = await fetch(`${API_URL}/ocr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("OCR failed");
      const data = await res.json();
      const sentences: string[] = (data.sentences as string[]).filter((s) => s.trim().length > 0);
      if (sentences.length === 1) {
        setText(sentences[0]);
      } else if (sentences.length > 1) {
        setCandidates(sentences);
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      Alert.alert(t("add.errorTitle"), isTimeout ? t("add.timedOut") : t("add.couldNotExtract"));
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      let resolvedBookId = bookId;
      if (bookSearch.trim() && !resolvedBookId) {
        try {
          const newBook = await apiFetch<Book>("/books", token, {
            method: "POST",
            body: JSON.stringify({ title: bookSearch.trim(), language: detectLang(bookSearch.trim()) }),
          });
          setBooks((prev) => [...prev, newBook]);
          resolvedBookId = newBook.id;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const existing = books.find(
              (b) => b.title.toLowerCase() === bookSearch.trim().toLowerCase()
            );
            if (existing) resolvedBookId = existing.id;
          }
          if (!resolvedBookId) throw err;
        }
      }

      await apiFetch<Quote>("/quotes", token, {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          source_type: resolvedBookId ? "book" : null,
          book_id: resolvedBookId || null,
          page: page ? parseInt(page) : null,
        }),
      });

      setText(""); setSourceOpen(false);
      setBookSearch(""); setBookId(""); setPage("");
      onAdded?.();
      navigation.navigate("Feed" as never);
    } catch {
      Alert.alert(t("add.errorTitle"), t("add.couldNotSave"));
    } finally {
      setSaving(false);
    }
  }


  const hasSelection = dragRect !== null && dragRect.w > 10 && dragRect.h > 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.heading, { color: colors.fg }]}>{t("add.heading")}</Text>

          {/* Capture buttons */}
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={[styles.captureBtn, { borderColor: colors.border }]}
              onPress={() => captureFromImage(true)}
              disabled={extracting}
            >
              <Text style={[styles.captureBtnText, { color: colors.mutedFg }]}>{t("add.camera")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureBtn, { borderColor: colors.border }]}
              onPress={() => captureFromImage(false)}
              disabled={extracting}
            >
              <Text style={[styles.captureBtnText, { color: colors.mutedFg }]}>{t("add.library")}</Text>
            </TouchableOpacity>
            {extracting && <ActivityIndicator color={colors.primary} />}
          </View>

          {/* Quote text */}
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
            value={text}
            onChangeText={setText}
            multiline
            placeholder={t("add.placeholder")}
            placeholderTextColor={colors.mutedFg}
            autoFocus={false}
          />

          {/* Save — primary action immediately below the text */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary },
              (!text.trim() || saving) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!text.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={colors.primaryFg} />
              : <Text style={[styles.saveBtnText, { color: colors.primaryFg }]}>{t("add.save")}</Text>
            }
          </TouchableOpacity>

          {/* Source (collapsible) */}
          <TouchableOpacity
            style={[styles.collapseRow, { borderTopColor: colors.border }]}
            onPress={() => {
              const next = !sourceOpen;
              setSourceOpen(next);
              if (next) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.collapseLabel, { color: bookSearch ? colors.fg : colors.mutedFg }]} numberOfLines={1}>
              {bookSearch ? t("add.fromSource", { title: bookSearch }) : t("add.addSource")}
            </Text>
            <Feather name={sourceOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedFg} />
          </TouchableOpacity>

          {sourceOpen && (
            <View style={styles.collapseBody}>
              {bookId ? (
                // Selected: book name + page + clear all on one row
                <View style={[styles.selectedCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                  <Feather name="book" size={14} color={colors.mutedFg} style={{ marginTop: 2 }} />
                  <Text style={[styles.selectedCardTitle, { color: colors.fg }]}>{bookSearch}</Text>
                  <TextInput
                    style={[styles.pageInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.bg }]}
                    value={page}
                    onChangeText={(v) => setPage(v.replace(/\D/g, ""))}
                    placeholder={t("add.page")}
                    placeholderTextColor={colors.mutedFg}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => { setBookId(""); setBookSearch(""); setPage(""); }}>
                    <Feather name="x" size={16} color={colors.mutedFg} />
                  </TouchableOpacity>
                </View>
              ) : (
                // Search
                <View>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
                    value={bookSearch}
                    onChangeText={(v) => { setBookSearch(v); setBookId(""); }}
                    placeholder={t("add.searchBooks")}
                    placeholderTextColor={colors.mutedFg}
                  />
                  {bookSearch.length > 0 && filteredBooks.length > 0 && !saving && (
                    <View style={[styles.dropdown, { backgroundColor: colors.muted }]}>
                      {filteredBooks.slice(0, 5).map((b, i) => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.dropdownItem, { borderBottomColor: i < Math.min(filteredBooks.length, 5) - 1 ? colors.border : "transparent" }]}
                          onPress={() => { setBookId(b.id); setBookSearch(b.title); }}
                        >
                          <Text style={[styles.dropdownText, { color: colors.fg }]}>{b.title}</Text>
                          {b.author && <Text style={[styles.dropdownSub, { color: colors.mutedFg }]}>{b.author}</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {bookSearch.length > 0 && !bookId && !saving && (
                    <View style={styles.newBookHint}>
                      <Feather name="book" size={12} color={colors.mutedFg} />
                      <Text style={[styles.newBookHintText, { color: colors.mutedFg }]}>
                        {t("add.newBook")}: {bookSearch}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Candidate picker */}
      <Modal
        visible={candidates.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setCandidates([])}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setCandidates([])}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.pickerTitle, { color: colors.fg }]}>{t("add.selectPassage")}</Text>
            <Text style={[styles.pickerSub, { color: colors.mutedFg }]}>{t("add.whichPassage")}</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {candidates.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pickerCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
                  onPress={() => { setText(c); setCandidates([]); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerCardText, { color: colors.fg }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.pickerCancel, { borderColor: colors.border }]}
              onPress={() => setCandidates([])}
            >
              <Text style={[styles.pickerCancelText, { color: colors.mutedFg }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image annotation modal */}
      <Modal
        visible={annotImage !== null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setAnnotImage(null)}
      >
        <SafeAreaView style={styles.annotContainer} edges={["top", "bottom"]}>
          <View style={styles.annotHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.annotTitle}>{t("add.markQuote")}</Text>
              <Text style={styles.annotHint}>{t("add.dragHint")}</Text>
            </View>
            <TouchableOpacity onPress={() => setAnnotImage(null)} style={styles.annotClose}>
              <Text style={styles.annotCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View
            style={styles.annotImgContainer}
            onLayout={(e) => { annotLayoutRef.current = e.nativeEvent.layout; setAnnotLayout(e.nativeEvent.layout); }}
          >
            {annotImage && (
              <Image
                source={{ uri: annotImage.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            )}
            <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
              {hasSelection && dragRect && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View
                    style={{
                      position: "absolute",
                      left: dragRect.x,
                      top: dragRect.y,
                      width: dragRect.w,
                      height: dragRect.h,
                      borderWidth: 2,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59,130,246,0.18)",
                      borderRadius: 4,
                    }}
                  />
                  {[
                    { left: dragRect.x - HANDLE_SIZE / 2,              top: dragRect.y - HANDLE_SIZE / 2 },
                    { left: dragRect.x + dragRect.w - HANDLE_SIZE / 2, top: dragRect.y - HANDLE_SIZE / 2 },
                    { left: dragRect.x - HANDLE_SIZE / 2,              top: dragRect.y + dragRect.h - HANDLE_SIZE / 2 },
                    { left: dragRect.x + dragRect.w - HANDLE_SIZE / 2, top: dragRect.y + dragRect.h - HANDLE_SIZE / 2 },
                  ].map((pos, i) => (
                    <View
                      key={i}
                      style={{
                        position: "absolute",
                        left: pos.left,
                        top: pos.top,
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        backgroundColor: "#3b82f6",
                        borderRadius: 3,
                        borderWidth: 2,
                        borderColor: "#fff",
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.annotFooter}>
            {hasSelection && (
              <TouchableOpacity
                style={styles.annotClearBtn}
                onPress={() => { dragRectRef.current = null; setDragRect(null); }}
              >
                <Text style={styles.annotClearText}>{t("add.clear")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.annotSkipBtn}
              onPress={() => { const b64 = annotImage!.base64; setAnnotImage(null); sendToOCR(b64, null); }}
            >
              <Text style={styles.annotSkipText}>{t("add.fullImage")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.annotExtractBtn}
              onPress={() => {
                const b64 = annotImage!.base64;
                const sel =
                  hasSelection && dragRect && annotImage && annotLayout
                    ? toNormalized(dragRect, annotImage.iw, annotImage.ih, annotLayout)
                    : null;
                setAnnotImage(null);
                sendToOCR(b64, sel);
              }}
            >
              <Text style={styles.annotExtractText}>
                {hasSelection ? t("add.extractSelection") : t("add.extract")}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: "600", marginBottom: 16 },
  captureRow: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "center" },
  captureBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  captureBtnText: { fontSize: 14 },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
  // Collapsible rows
  collapseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  collapseLabel: { fontSize: 15, flex: 1, marginRight: 8 },
  // Book selected card
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  selectedCardTitle: { fontSize: 14, fontWeight: "500", flex: 1, lineHeight: 20 },
  pageInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    width: 56,
    textAlign: "center",
  },
  // Book search
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  dropdown: {
    marginLeft: 8,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownText: { fontSize: 14 },
  dropdownSub: { fontSize: 12, marginTop: 2 },
  newBookHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 4, paddingHorizontal: 2 },
  newBookHintText: { fontSize: 13 },
  // Candidate picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "80%",
  },
  pickerTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  pickerSub: { fontSize: 13, marginBottom: 16 },
  pickerScroll: { flexGrow: 0 },
  pickerCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  pickerCardText: { fontSize: 15, lineHeight: 22 },
  pickerCancel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  pickerCancelText: { fontSize: 15, fontWeight: "500" },
  // Annotation modal
  annotContainer: { flex: 1, backgroundColor: "#000" },
  annotHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  annotTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  annotHint: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 },
  annotClose: { padding: 6, marginLeft: 12 },
  annotCloseText: { fontSize: 20, color: "rgba(255,255,255,0.65)" },
  annotImgContainer: { flex: 1 },
  annotFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  annotClearBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  annotClearText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500" },
  annotSkipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  annotSkipText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  annotExtractBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
  },
  annotExtractText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
