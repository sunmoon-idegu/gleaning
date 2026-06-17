import * as Clipboard from "expo-clipboard";
import Feather from "@expo/vector-icons/Feather";
import { useRef, useState } from "react";
import {
  PanResponder,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { type Quote } from "../lib/api";

function sourceLabel(quote: Quote): string | null {
  const s = quote.source;
  if (!s) return null;
  if (s.type === "book" && s.book) {
    const parts: string[] = [s.book.title];
    if (s.book.author) parts.push(`by ${s.book.author}`);
    if (quote.page) parts.push(`p. ${quote.page}`);
    return parts.join("  ·  ");
  }
  if (s.type === "video") return s.title;
  if (s.type === "live") return s.author ? `Live  ·  ${s.author}` : "Live";
  return null;
}

interface Props {
  quote: Quote;
  onBack: () => void;
}

export default function QuoteDetailScreen({ quote, onBack }: Props) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const swipeBack = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => { if (gs.dx > 50) onBack(); },
    })
  ).current;
  const src = sourceLabel(quote);
  const date = new Date(quote.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleCopy() {
    await Clipboard.setStringAsync(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Left-edge invisible strip captures right-swipe to go back */}
      <View style={styles.swipeEdge} {...swipeBack.panHandlers} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.fg} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.quoteText, { color: colors.fg }]}>
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
          <Feather
            name={copied ? "check" : "copy"}
            size={16}
            color={copied ? "#22c55e" : colors.fg}
          />
          <Text style={[styles.actionLabel, { color: copied ? "#22c55e" : colors.fg }]}>
            {copied ? "Copied!" : "Copy"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.muted }]}
          onPress={() => Share.share({ message: quote.text })}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={16} color={colors.fg} />
          <Text style={[styles.actionLabel, { color: colors.fg }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  swipeEdge: { position: "absolute", left: 0, top: 0, bottom: 0, width: 24, zIndex: 10 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
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
    fontSize: 20,
    lineHeight: 34,
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
