import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
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
import { apiFetch, type Book, type Quote } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const CORNER_HIT = 26; // touch radius for corner handles
const HANDLE_SIZE = 13; // visual size of corner dots

type SourceType = "book" | "video" | "live" | "unknown" | null;

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
  const navigation = useNavigation();

  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [creatingBook, setCreatingBook] = useState(false);
  const [page, setPage] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [liveSpeaker, setLiveSpeaker] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  // Annotation state
  const [annotImage, setAnnotImage] = useState<{ uri: string; base64: string; iw: number; ih: number } | null>(null);
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [annotLayout, setAnnotLayout] = useState<{ width: number; height: number } | null>(null);

  // Refs so PanResponder callbacks (created once) can read current state
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
        // locationX/Y may be relative to a child view if touch lands on the selection
        // box or a handle. Use them only for hit-testing (which is tolerant of small
        // offsets). Actual movement uses gestureState.dx/dy which are always deltas
        // from the gesture origin and are coordinate-space independent.
        const { locationX: tx, locationY: ty } = e.nativeEvent;
        const rect = dragRectRef.current;

        if (rect && rect.w > 10 && rect.h > 10) {
          // Check corner handles first (generous hit target)
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
              startPt.current = { x: c.px, y: c.py }; // active corner at grant time
              return;
            }
          }
          // Inside box (with a small margin for border touches) → move
          if (
            tx >= rect.x - 8 && tx <= rect.x + rect.w + 8 &&
            ty >= rect.y - 8 && ty <= rect.y + rect.h + 8
          ) {
            gestureMode.current = "move";
            moveOrigin.current = { bx: rect.x, by: rect.y };
            return;
          }
        }

        // Outside (or no box) → draw new box
        gestureMode.current = "draw";
        startPt.current = { x: tx, y: ty };
        dragRectRef.current = { x: tx, y: ty, w: 0, h: 0 };
        setDragRect({ x: tx, y: ty, w: 0, h: 0 });
      },
      onPanResponderMove: (_e, gestureState) => {
        // Use gestureState.dx/dy — these are deltas from the gesture start and are
        // consistent regardless of which child view received the initial touch.
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

  async function captureFromImage(fromCamera: boolean) {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera access is needed to take photos.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Photo library access is needed.");
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
      Alert.alert("Error", isTimeout ? "Request timed out. Try again." : "Could not extract text. Try again.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleCreateBook() {
    if (creatingBook || !bookSearch.trim()) return;
    setCreatingBook(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const newBook = await apiFetch<Book>("/books", token, {
        method: "POST",
        body: JSON.stringify({ title: bookSearch.trim() }),
      });
      setBooks((prev) => [...prev, newBook]);
      setBookId(newBook.id);
      setBookSearch(newBook.title);
    } catch {
      Alert.alert("Error", "Could not create book. Try again.");
    } finally {
      setCreatingBook(false);
    }
  }

  function addTag(val: string) {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((t) => [...t, trimmed]);
    setTagInput("");
  }

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      let sourceId: string | null = null;

      if (sourceType === "book" && bookId) {
        const src = await apiFetch<{ id: string }>("/sources", token, {
          method: "POST",
          body: JSON.stringify({ type: "book", book_id: bookId }),
        });
        sourceId = src.id;
      } else if (sourceType === "video" && videoTitle) {
        const src = await apiFetch<{ id: string }>("/sources", token, {
          method: "POST",
          body: JSON.stringify({ type: "video", title: videoTitle }),
        });
        sourceId = src.id;
      } else if (sourceType === "live") {
        const src = await apiFetch<{ id: string }>("/sources", token, {
          method: "POST",
          body: JSON.stringify({ type: "live", author: liveSpeaker || null }),
        });
        sourceId = src.id;
      } else if (sourceType === "unknown") {
        const src = await apiFetch<{ id: string }>("/sources", token, {
          method: "POST",
          body: JSON.stringify({ type: "unknown" }),
        });
        sourceId = src.id;
      }

      const tagIds: string[] = [];
      for (const name of tags) {
        const tag = await apiFetch<{ id: string }>("/tags", token, {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        tagIds.push(tag.id);
      }

      await apiFetch<Quote>("/quotes", token, {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          page: page ? parseInt(page) : null,
          source_id: sourceId,
          tag_ids: tagIds,
        }),
      });

      setText(""); setSourceType(null); setBookSearch(""); setBookId("");
      setPage(""); setVideoTitle(""); setLiveSpeaker(""); setTags([]); setTagInput("");
      onAdded?.();
      Alert.alert("Saved", "Quote saved to Gleaning.", [
        { text: "OK", onPress: () => navigation.navigate("Feed" as never) },
      ]);
    } catch {
      Alert.alert("Error", "Could not save quote. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const sourceTypes: { value: SourceType; label: string }[] = [
    { value: "book", label: "Book" },
    { value: "video", label: "Video" },
    { value: "live", label: "Live" },
    { value: "unknown", label: "Unknown" },
  ];

  const hasSelection = dragRect !== null && dragRect.w > 10 && dragRect.h > 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.heading, { color: colors.fg }]}>Add quote</Text>

          {/* Camera buttons */}
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={[styles.captureBtn, { borderColor: colors.border }]}
              onPress={() => captureFromImage(true)}
              disabled={extracting}
            >
              <Text style={[styles.captureBtnText, { color: colors.mutedFg }]}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureBtn, { borderColor: colors.border }]}
              onPress={() => captureFromImage(false)}
              disabled={extracting}
            >
              <Text style={[styles.captureBtnText, { color: colors.mutedFg }]}>🖼 Library</Text>
            </TouchableOpacity>
            {extracting && <ActivityIndicator color={colors.primary} />}
          </View>

          {/* Quote text */}
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="The quote…"
            placeholderTextColor={colors.mutedFg}
            autoFocus={false}
          />

          {/* Source type pills */}
          <View style={styles.pills}>
            {sourceTypes.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.pill,
                  { backgroundColor: colors.muted },
                  sourceType === value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSourceType(sourceType === value ? null : value)}
              >
                <Text style={[
                  styles.pillText,
                  { color: colors.mutedFg },
                  sourceType === value && { color: colors.primaryFg },
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Book */}
          {sourceType === "book" && (
            <View style={styles.section}>
              <View style={styles.bookRow}>
                <TextInput
                  style={[styles.input, styles.bookInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
                  value={bookSearch}
                  onChangeText={(v) => { setBookSearch(v); setBookId(""); }}
                  placeholder="Search books…"
                  placeholderTextColor={colors.mutedFg}
                />
                <TextInput
                  style={[styles.input, styles.pageInput, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
                  value={page}
                  onChangeText={(v) => setPage(v.replace(/\D/g, ""))}
                  placeholder="Page"
                  placeholderTextColor={colors.mutedFg}
                  keyboardType="numeric"
                />
              </View>
              {bookSearch && !bookId && (
                <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                  {filteredBooks.slice(0, 5).map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => { setBookId(b.id); setBookSearch(b.title); }}
                    >
                      <Text style={[styles.dropdownText, { color: colors.fg }]}>{b.title}</Text>
                      {b.author && <Text style={[styles.dropdownSub, { color: colors.mutedFg }]}>{b.author}</Text>}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.dropdownItem, { borderBottomColor: "transparent" }]}
                    onPress={handleCreateBook}
                    disabled={creatingBook}
                  >
                    {creatingBook
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Text style={[styles.dropdownText, { color: colors.primary }]}>
                          + Create "{bookSearch}"
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Video */}
          {sourceType === "video" && (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
              value={videoTitle}
              onChangeText={setVideoTitle}
              placeholder="Video title"
              placeholderTextColor={colors.mutedFg}
            />
          )}

          {/* Live */}
          {sourceType === "live" && (
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
              value={liveSpeaker}
              onChangeText={setLiveSpeaker}
              placeholder="Speaker (optional)"
              placeholderTextColor={colors.mutedFg}
            />
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <View style={styles.tagList}>
              {tags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, { backgroundColor: colors.muted }]}
                  onPress={() => setTags(tags.filter((x) => x !== t))}
                >
                  <Text style={[styles.tagChipText, { color: colors.mutedFg }]}>{t} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={() => addTag(tagInput)}
            onBlur={() => { if (tagInput) addTag(tagInput); }}
            placeholder="Tags (press return to add)"
            placeholderTextColor={colors.mutedFg}
            returnKeyType="done"
          />

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, (!text.trim() || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!text.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={colors.primaryFg} />
              : <Text style={[styles.saveBtnText, { color: colors.primaryFg }]}>Save quote</Text>
            }
          </TouchableOpacity>
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
            <Text style={[styles.pickerTitle, { color: colors.fg }]}>Select a passage</Text>
            <Text style={[styles.pickerSub, { color: colors.mutedFg }]}>Which one did you have in mind?</Text>
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
              <Text style={styles.annotTitle}>Mark your quote</Text>
              <Text style={styles.annotHint}>Drag to select · move box · drag corners to resize</Text>
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
              {/* pointerEvents="none" ensures touches always hit the PanResponder view
                  above, keeping locationX/Y in the container's coordinate space. */}
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
              <TouchableOpacity style={styles.annotClearBtn} onPress={() => { dragRectRef.current = null; setDragRect(null); }}>
                <Text style={styles.annotClearText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.annotSkipBtn}
              onPress={() => { const b64 = annotImage!.base64; setAnnotImage(null); sendToOCR(b64, null); }}
            >
              <Text style={styles.annotSkipText}>Full image</Text>
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
                {hasSelection ? "Extract selection" : "Extract"}
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
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  pill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  pillText: { fontSize: 14 },
  section: { gap: 10, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  bookRow: { flexDirection: "row", gap: 8 },
  bookInput: { flex: 7, marginBottom: 0 },
  pageInput: { flex: 3, marginBottom: 0 },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1 },
  dropdownText: { fontSize: 14 },
  dropdownSub: { fontSize: 12, marginTop: 2 },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tagChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  tagChipText: { fontSize: 13 },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
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
  // Annotation
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
