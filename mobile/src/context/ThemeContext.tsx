import { useAuth } from "@clerk/clerk-expo";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../lib/api";

export type ThemeMode = "light" | "dark" | "colorful";
export type FeedMode = "list" | "card";
export type SortOrder = "newest" | "oldest" | "random";
export type AppFontSize = "small" | "medium" | "large";

export interface ThemeColors {
  bg: string;
  fg: string;
  border: string;
  muted: string;
  mutedFg: string;
  cardBg: string;
  primary: string;
  primaryFg: string;
  tabActive: string;
  tabInactive: string;
  tabBorder: string;
  tabBg: string;
}

const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#fff", fg: "#111", border: "#f0f0f0", muted: "#f5f5f5", mutedFg: "#888",
    cardBg: "#fafafa", primary: "#111", primaryFg: "#fff",
    tabActive: "#111", tabInactive: "#bbb", tabBorder: "#f0f0f0", tabBg: "#fff",
  },
  dark: {
    bg: "#111", fg: "#f5f5f5", border: "#2a2a2a", muted: "#1e1e1e", mutedFg: "#888",
    cardBg: "#1a1a1a", primary: "#f5f5f5", primaryFg: "#111",
    tabActive: "#f5f5f5", tabInactive: "#555", tabBorder: "#222", tabBg: "#111",
  },
  colorful: {
    bg: "#fffbeb", fg: "#292400", border: "#fde68a", muted: "#fef3c7", mutedFg: "#a16207",
    cardBg: "#fff", primary: "#ca8a04", primaryFg: "#fff",
    tabActive: "#ca8a04", tabInactive: "#c9a87a", tabBorder: "#fde68a", tabBg: "#fffbeb",
  },
};

export const FONT_SIZES: Record<AppFontSize, { list: number; card: number; detail: number }> = {
  small:  { list: 14, card: 18, detail: 15 },
  medium: { list: 16, card: 20, detail: 17 },
  large:  { list: 19, card: 23, detail: 20 },
};

// SecureStore keys for immediate local cache
const THEME_KEY     = "gleaning_theme";
const FEED_MODE_KEY = "gleaning_feed_mode";
const SORT_KEY      = "gleaning_sort_order";
const FONT_KEY      = "gleaning_font_size";

interface ApiPrefs {
  theme?: string;
  feed_mode?: string;
  sort_order?: string;
  font_size?: string;
}

interface ThemeContextValue {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (t: ThemeMode) => void;
  cycleTheme: () => void;
  feedMode: FeedMode;
  setFeedMode: (m: FeedMode) => void;
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;
  appFontSize: AppFontSize;
  setAppFontSize: (f: AppFontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light", colors: palette.light, setTheme: () => {}, cycleTheme: () => {},
  feedMode: "list", setFeedMode: () => {},
  sortOrder: "newest", setSortOrder: () => {},
  appFontSize: "medium", setAppFontSize: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === "dark";
  const { getToken, isSignedIn } = useAuth();

  const [theme, setThemeState] = useState<ThemeMode>(systemDark ? "dark" : "light");
  const [feedMode, setFeedModeState] = useState<FeedMode>("list");
  const [sortOrder, setSortOrderState] = useState<SortOrder>("newest");
  const [appFontSize, setAppFontSizeState] = useState<AppFontSize>("medium");

  // Debounce PATCH calls so rapid changes (e.g., tapping font size quickly) batch into one request
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<ApiPrefs>({});

  function applyPrefs(prefs: ApiPrefs) {
    if (prefs.theme === "light" || prefs.theme === "dark" || prefs.theme === "colorful") setThemeState(prefs.theme);
    if (prefs.feed_mode === "list" || prefs.feed_mode === "card") setFeedModeState(prefs.feed_mode);
    if (prefs.sort_order === "newest" || prefs.sort_order === "oldest" || prefs.sort_order === "random") setSortOrderState(prefs.sort_order);
    if (prefs.font_size === "small" || prefs.font_size === "medium" || prefs.font_size === "large") setAppFontSizeState(prefs.font_size);
  }

  // On sign-in: load from API first, fall back to SecureStore while request is in flight
  useEffect(() => {
    if (!isSignedIn) return;

    // Immediate local restore while API loads
    Promise.all([
      SecureStore.getItemAsync(THEME_KEY),
      SecureStore.getItemAsync(FEED_MODE_KEY),
      SecureStore.getItemAsync(SORT_KEY),
      SecureStore.getItemAsync(FONT_KEY),
    ]).then(([t, fm, so, fs]) => {
      applyPrefs({ theme: t ?? undefined, feed_mode: fm ?? undefined, sort_order: so ?? undefined, font_size: fs ?? undefined });
    });

    // Then override with authoritative server values
    getToken().then((token) => {
      if (!token) return;
      apiFetch<ApiPrefs>("/users/me/preferences", token).then((prefs) => {
        applyPrefs(prefs);
        // Sync server values back to local cache
        if (prefs.theme)      SecureStore.setItemAsync(THEME_KEY, prefs.theme);
        if (prefs.feed_mode)  SecureStore.setItemAsync(FEED_MODE_KEY, prefs.feed_mode);
        if (prefs.sort_order) SecureStore.setItemAsync(SORT_KEY, prefs.sort_order);
        if (prefs.font_size)  SecureStore.setItemAsync(FONT_KEY, prefs.font_size);
      }).catch(() => {}); // network failure — local cache already applied
    });
  }, [isSignedIn]);

  function persistPatch(patch: ApiPrefs) {
    // Local cache — immediate
    if (patch.theme)      SecureStore.setItemAsync(THEME_KEY, patch.theme);
    if (patch.feed_mode)  SecureStore.setItemAsync(FEED_MODE_KEY, patch.feed_mode);
    if (patch.sort_order) SecureStore.setItemAsync(SORT_KEY, patch.sort_order);
    if (patch.font_size)  SecureStore.setItemAsync(FONT_KEY, patch.font_size);

    // API — debounced 600ms
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(async () => {
      const body = pendingPatch.current;
      pendingPatch.current = {};
      const token = await getToken().catch(() => null);
      if (!token) return;
      apiFetch("/users/me/preferences", token, {
        method: "PATCH",
        body: JSON.stringify(body),
      }).catch(() => {}); // silent — local cache already updated
    }, 600);
  }

  const setTheme = (t: ThemeMode) => { setThemeState(t); persistPatch({ theme: t }); };
  const cycleTheme = () => setThemeState((t) => {
    const next: ThemeMode = t === "light" ? "dark" : t === "dark" ? "colorful" : "light";
    persistPatch({ theme: next });
    return next;
  });
  const setFeedMode = (m: FeedMode) => { setFeedModeState(m); persistPatch({ feed_mode: m }); };
  const setSortOrder = (s: SortOrder) => { setSortOrderState(s); persistPatch({ sort_order: s }); };
  const setAppFontSize = (f: AppFontSize) => { setAppFontSizeState(f); persistPatch({ font_size: f }); };

  return (
    <ThemeContext.Provider value={{
      theme, colors: palette[theme], setTheme, cycleTheme,
      feedMode, setFeedMode,
      sortOrder, setSortOrder,
      appFontSize, setAppFontSize,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
