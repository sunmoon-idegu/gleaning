import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark" | "colorful";
export type FeedMode = "list" | "card";

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
    bg: "#fff",
    fg: "#111",
    border: "#f0f0f0",
    muted: "#f5f5f5",
    mutedFg: "#888",
    cardBg: "#fafafa",
    primary: "#111",
    primaryFg: "#fff",
    tabActive: "#111",
    tabInactive: "#bbb",
    tabBorder: "#f0f0f0",
    tabBg: "#fff",
  },
  dark: {
    bg: "#111",
    fg: "#f5f5f5",
    border: "#2a2a2a",
    muted: "#1e1e1e",
    mutedFg: "#888",
    cardBg: "#1a1a1a",
    primary: "#f5f5f5",
    primaryFg: "#111",
    tabActive: "#f5f5f5",
    tabInactive: "#555",
    tabBorder: "#222",
    tabBg: "#111",
  },
  colorful: {
    bg: "#fffbeb",
    fg: "#292400",
    border: "#fde68a",
    muted: "#fef3c7",
    mutedFg: "#a16207",
    cardBg: "#fff",
    primary: "#ca8a04",
    primaryFg: "#fff",
    tabActive: "#ca8a04",
    tabInactive: "#c9a87a",
    tabBorder: "#fde68a",
    tabBg: "#fffbeb",
  },
};

const THEME_STORAGE_KEY = "gleaning_theme";
const FEED_MODE_KEY = "gleaning_feed_mode";

interface ThemeContextValue {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (t: ThemeMode) => void;
  cycleTheme: () => void;
  feedMode: FeedMode;
  setFeedMode: (m: FeedMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  colors: palette.light,
  setTheme: () => {},
  cycleTheme: () => {},
  feedMode: "list",
  setFeedMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === "dark";
  const [theme, setThemeState] = useState<ThemeMode>(systemDark ? "dark" : "light");
  const [feedMode, setFeedModeState] = useState<FeedMode>("list");

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "colorful") {
        setThemeState(saved);
      }
    });
    SecureStore.getItemAsync(FEED_MODE_KEY).then((saved) => {
      if (saved === "list" || saved === "card") setFeedModeState(saved);
    });
  }, []);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, t);
  };

  const cycleTheme = () =>
    setThemeState((t) => {
      const next: ThemeMode = t === "light" ? "dark" : t === "dark" ? "colorful" : "light";
      SecureStore.setItemAsync(THEME_STORAGE_KEY, next);
      return next;
    });

  const setFeedMode = (m: FeedMode) => {
    setFeedModeState(m);
    SecureStore.setItemAsync(FEED_MODE_KEY, m);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: palette[theme], setTheme, cycleTheme, feedMode, setFeedMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
