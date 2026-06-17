import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, type Quote } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

export default function SearchScreen() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text style={[styles.heading, { color: colors.fg }]}>Search</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.fg, backgroundColor: colors.cardBg }]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Search quotes, books, tags…"
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
            <View style={[styles.card, { borderBottomColor: colors.border }]}>
              <Text style={[styles.quoteText, { color: colors.fg }]}>{item.text}</Text>
              {item.source?.book && (
                <Text style={[styles.source, { color: colors.mutedFg }]}>{item.source.book.title}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            searched ? (
              <Text style={[styles.empty, { color: colors.mutedFg }]}>No results for "{query}"</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 22, fontWeight: "600", padding: 20, paddingBottom: 12 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },
  empty: { fontSize: 15 },
  card: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  quoteText: { fontSize: 15, lineHeight: 24 },
  source: { fontSize: 13, marginTop: 6 },
});
