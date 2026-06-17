import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, type Quote } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import QuoteDetailScreen from "./QuoteDetailScreen";

function sourceLabel(quote: Quote): string | null {
  const s = quote.source;
  if (!s) return null;
  if (s.type === "book" && s.book) return s.book.title;
  if (s.type === "video") return s.title;
  if (s.type === "live") return s.author ? `Live · ${s.author}` : "Live";
  return null;
}

function ListQuoteItem({
  quote,
  colors,
  onPress,
}: {
  quote: Quote;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  const src = sourceLabel(quote);
  return (
    <TouchableOpacity
      style={[styles.listCard, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.listQuoteText, { color: colors.fg }]}>{quote.text}</Text>
      <View style={styles.meta}>
        {src && <Text style={[styles.source, { color: colors.mutedFg }]}>{src}</Text>}
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
    </TouchableOpacity>
  );
}

function CardQuoteItem({
  quote,
  colors,
  width,
  onPress,
}: {
  quote: Quote;
  colors: ReturnType<typeof useTheme>["colors"];
  width: number;
  onPress: () => void;
}) {
  const src = sourceLabel(quote);

  return (
    <TouchableOpacity
      style={[styles.cardItem, { width, backgroundColor: colors.bg }]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardQuoteText, { color: colors.fg }]}>{quote.text}</Text>
        {src && (
          <Text style={[styles.cardSource, { color: colors.mutedFg }]}>{src}</Text>
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
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const { getToken } = useAuth();
  const { colors, feedMode } = useTheme();
  const { width } = useWindowDimensions();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [cardIndex, setCardIndex] = useState(0);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCardIndex(viewableItems[0].index);
    }
  }).current;

  async function load(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<Quote[]>("/quotes", token);
      setQuotes(data.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => load(true), []);

  if (selectedQuote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <QuoteDetailScreen quote={selectedQuote} onBack={() => setSelectedQuote(null)} />
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

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]} edges={["top"]}>
        <Text style={[styles.errorText, { color: colors.mutedFg }]}>Failed to load quotes.</Text>
        <TouchableOpacity onPress={() => load()}>
          <Text style={[styles.retry, { color: colors.fg }]}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (feedMode === "card") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <CardQuoteItem
              quote={item}
              colors={colors}
              width={width}
              onPress={() => setSelectedQuote(item)}
            />
          )}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedFg} />
          }
          ListEmptyComponent={
            <View style={[styles.cardEmpty, { width }]}>
              <Text style={[styles.empty, { color: colors.mutedFg }]}>No quotes yet. Add your first one!</Text>
            </View>
          }
        />
        {quotes.length > 0 && (
          <Text style={[styles.cardCounter, { color: colors.mutedFg }]}>
            {cardIndex + 1} / {quotes.length}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text style={[styles.heading, { color: colors.fg }]}>Feed</Text>
      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => (
          <ListQuoteItem
            quote={item}
            colors={colors}
            onPress={() => setSelectedQuote(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedFg} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedFg }]}>
            No quotes yet. Add your first one!
          </Text>
        }
        contentContainerStyle={quotes.length === 0 ? styles.emptyContainer : styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "600", padding: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 15 },
  // List mode
  listCard: {
    paddingVertical: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listQuoteText: { fontSize: 16, lineHeight: 26 },
  meta: { marginTop: 10, gap: 6 },
  source: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  // Card mode
  cardItem: {
    flex: 1,
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  cardQuoteText: { fontSize: 22, lineHeight: 38, fontWeight: "400" },
  cardSource: { fontSize: 14, marginTop: 24 },
  cardCounter: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    fontSize: 12,
  },
  cardEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { marginBottom: 12 },
  retry: { fontWeight: "500" },
});
