import { useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  Animated,
  ActivityIndicator,
  Easing,
  FlatList,
  PanResponder,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, type Quote } from "../lib/api";
import { useTheme, FONT_SIZES } from "../context/ThemeContext";
import QuoteDetailScreen from "./QuoteDetailScreen";

function sourceLabel(quote: Quote): string | null {
  if (quote.source_type === "book" && quote.book) return quote.book.title;
  return null;
}

function ListQuoteItem({
  quote,
  colors,
  fontSize,
  onPress,
}: {
  quote: Quote;
  colors: ReturnType<typeof useTheme>["colors"];
  fontSize: number;
  onPress: () => void;
}) {
  const src = sourceLabel(quote);
  return (
    <TouchableOpacity
      style={[styles.listCard, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.listQuoteText, { color: colors.fg, fontSize }]}>{quote.text}</Text>
      <View style={styles.meta}>
        {src && <Text style={[styles.source, { color: colors.mutedFg }]}>{src}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function CardQuoteItem({
  quote,
  colors,
  width,
  fontSize,
  onPress,
}: {
  quote: Quote;
  colors: ReturnType<typeof useTheme>["colors"];
  width: number;
  fontSize: number;
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
        <Text style={[styles.cardQuoteText, { color: colors.fg, fontSize, lineHeight: fontSize * 1.7 }]}>{quote.text}</Text>
        {src && <Text style={[styles.cardSource, { color: colors.mutedFg }]}>{src}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const { getToken } = useAuth();
  const { colors, feedMode, setFeedMode, sortOrder, appFontSize } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(width)).current;

  const sortedQuotes = useMemo(() => {
    if (sortOrder === "oldest") return [...quotes].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sortOrder === "random") return [...quotes].sort(() => Math.random() - 0.5);
    return [...quotes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [quotes, sortOrder]);

  const listFontSize = FONT_SIZES[appFontSize].list;
  const cardFontSize = FONT_SIZES[appFontSize].card;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCardIndex(viewableItems[0].index);
    }
  }).current;

  function openDetail(quote: Quote) {
    setSelectedQuote(quote);
    setShowDetail(true);
    slideAnim.setValue(width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function closeDetail() {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowDetail(false);
      setSelectedQuote(null);
      slideAnim.setValue(width);
    });
  }

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        (gs.moveX - gs.dx) < width * 0.35 && Math.abs(gs.dx) > Math.abs(gs.dy) && gs.dx > 8,
      onPanResponderMove: Animated.event([null, { dx: slideAnim }], { useNativeDriver: true }),
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > width * 0.45 || gs.vx > 0.8) {
          closeDetail();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  async function load(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<Quote[]>("/quotes", token);
      setQuotes(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = useCallback(() => load(true), []);

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
        <Text style={[styles.errorText, { color: colors.mutedFg }]}>{t("feed.error")}</Text>
        <TouchableOpacity onPress={() => load()}>
          <Text style={[styles.retry, { color: colors.fg }]}>{t("feed.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const toggleIcon = feedMode === "list" ? "grid" : "list";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.fill} edges={["top"]}>
        {feedMode === "card" ? (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.heading, { color: colors.fg }]}>{t("feed.heading")}</Text>
              <TouchableOpacity onPress={() => setFeedMode("list")} hitSlop={12}>
                <Feather name="list" size={20} color={colors.fg} />
              </TouchableOpacity>
            </View>
            <FlatList
              key="card-feed"
              data={sortedQuotes}
              keyExtractor={(q) => q.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <CardQuoteItem quote={item} colors={colors} width={width} fontSize={cardFontSize} onPress={() => openDetail(item)} />
              )}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedFg} />}
              ListEmptyComponent={
                <View style={[styles.cardEmpty, { width }]}>
                  <Text style={[styles.empty, { color: colors.mutedFg }]}>{t("feed.empty")}</Text>
                </View>
              }
            />
            {sortedQuotes.length > 0 && (
              <Text style={[styles.cardCounter, { color: colors.mutedFg }]}>
                {cardIndex + 1} / {sortedQuotes.length}
              </Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.heading, { color: colors.fg }]}>{t("feed.heading")}</Text>
              <TouchableOpacity onPress={() => setFeedMode("card")} hitSlop={12}>
                <Feather name="grid" size={20} color={colors.fg} />
              </TouchableOpacity>
            </View>
            <FlatList
              key="list-feed"
              data={sortedQuotes}
              keyExtractor={(q) => q.id}
              renderItem={({ item }) => (
                <ListQuoteItem quote={item} colors={colors} fontSize={listFontSize} onPress={() => openDetail(item)} />
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedFg} />}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.mutedFg }]}>{t("feed.empty")}</Text>
              }
              contentContainerStyle={quotes.length === 0 ? styles.emptyContainer : styles.list}
            />
          </>
        )}
      </SafeAreaView>

      {/* Detail slides in over the feed */}
      {showDetail && selectedQuote && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}
          {...swipeResponder.panHandlers}
        >
          <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]} edges={["top"]}>
            <QuoteDetailScreen
              quote={selectedQuote}
              onBack={closeDetail}
              onDelete={() => setQuotes(prev => prev.filter(q => q.id !== selectedQuote.id))}
              onUpdate={(updated) => { setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q)); setSelectedQuote(updated); }}
            />
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: { fontSize: 22, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 15 },
  listCard: { paddingVertical: 28, borderBottomWidth: StyleSheet.hairlineWidth },
  listQuoteText: { fontSize: 16, lineHeight: 26 },
  meta: { marginTop: 10, gap: 6 },
  source: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  // Card mode
  cardItem: { flex: 1, justifyContent: "center" },
  cardContent: { flex: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 40 },
  cardQuoteText: { fontSize: 20, lineHeight: 34, fontWeight: "400" },
  cardSource: { fontSize: 14, marginTop: 24 },
  cardToggle: { position: "absolute", top: 16, right: 20 },
  cardCounter: { position: "absolute", bottom: 16, alignSelf: "center", fontSize: 12 },
  cardEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { marginBottom: 12 },
  retry: { fontWeight: "500" },
});
