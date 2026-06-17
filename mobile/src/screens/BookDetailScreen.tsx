import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch, type BookWithQuotes, type Quote } from "../lib/api";
import { useTheme, type ThemeColors } from "../context/ThemeContext";

function QuoteItem({ quote, colors }: { quote: Quote; colors: ThemeColors }) {
  const source = quote.source?.book?.title ?? quote.source?.title ?? null;
  const author = quote.source?.author ?? quote.source?.book?.author ?? quote.author ?? null;

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      <Text style={[styles.quoteText, { color: colors.fg }]}>{quote.text}</Text>
      <View style={styles.meta}>
        {(source || author) && (
          <Text style={[styles.source, { color: colors.mutedFg }]}>
            {[source, author].filter(Boolean).join(" · ")}
          </Text>
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
      </View>
    </View>
  );
}

interface BookDetailProps {
  bookId: string;
  onBack: () => void;
}

export default function BookDetail({ bookId, onBack }: BookDetailProps) {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [book, setBook] = useState<BookWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        <Text style={{ color: colors.mutedFg }}>Failed to load book.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TouchableOpacity style={styles.back} onPress={onBack}>
        <Text style={[styles.backText, { color: colors.mutedFg }]}>← Shelf</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.heading, { color: colors.fg }]}>{book.title}</Text>
        {book.author && (
          <Text style={[styles.subheading, { color: colors.mutedFg }]}>{book.author}</Text>
        )}
        <Text style={[styles.count, { color: colors.mutedFg }]}>
          {book.quotes.length} {book.quotes.length === 1 ? "quote" : "quotes"}
        </Text>
        {book.quotes.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedFg }]}>
            No quotes from this book yet.
          </Text>
        ) : (
          book.quotes.map((q) => <QuoteItem key={q.id} quote={q} colors={colors} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  back: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backText: { fontSize: 15 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },
  heading: { fontSize: 22, fontWeight: "600", marginBottom: 4 },
  subheading: { fontSize: 15, marginBottom: 4 },
  count: { fontSize: 13, marginBottom: 20 },
  empty: { fontSize: 14, marginTop: 12 },
  card: { paddingVertical: 24, borderBottomWidth: 1 },
  quoteText: { fontSize: 16, lineHeight: 26 },
  meta: { marginTop: 10, gap: 6 },
  source: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
});
