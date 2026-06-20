import { useAuth } from "@clerk/clerk-expo";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  FlatList,
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, type Quote } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import QuoteDetailScreen from "./QuoteDetailScreen";

export default function SearchScreen() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<{ quotes: Quote[] }>(`/search?q=${encodeURIComponent(query)}`, token);
      setResults(data.quotes);
    } finally {
      setLoading(false);
    }
  }

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
    }).start(() => { setShowDetail(false); setSelectedQuote(null); });
  }

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        (gs.moveX - gs.dx) < width * 0.35 && Math.abs(gs.dx) > Math.abs(gs.dy) && gs.dx > 8,
      onPanResponderMove: (_e, gs) => { if (gs.dx > 0) slideAnim.setValue(gs.dx); },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > width * 0.45 || gs.vx > 0.8) {
          closeDetail();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={[styles.heading, { color: colors.fg }]}>{t("search.heading")}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.mutedFg}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(q) => q.id}
            contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { borderBottomColor: colors.border }]}
                onPress={() => openDetail(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quoteText, { color: colors.fg }]} numberOfLines={3}>{item.text}</Text>
                {item.book && (
                  <Text style={[styles.source, { color: colors.mutedFg }]}>{item.book.title}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searched ? (
                <Text style={[styles.empty, { color: colors.mutedFg }]}>{t("search.noResults", { query })}</Text>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      {showDetail && selectedQuote && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}
          {...swipeResponder.panHandlers}
        >
          <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]} edges={["top"]}>
            <QuoteDetailScreen
              quote={selectedQuote}
              onBack={closeDetail}
              onDelete={() => setResults(prev => prev.filter(q => q.id !== selectedQuote.id))}
              onUpdate={(updated) => { setResults(prev => prev.map(q => q.id === updated.id ? updated : q)); setSelectedQuote(updated); }}
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
  container: { flex: 1 },
  heading: { fontSize: 22, fontWeight: "600", padding: 20, paddingBottom: 12 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },
  empty: { fontSize: 15 },
  card: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  quoteText: { fontSize: 15, lineHeight: 24 },
  source: { fontSize: 13, marginTop: 6 },
});
