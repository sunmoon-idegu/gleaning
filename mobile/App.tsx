import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { tokenCache } from "./src/tokenCache";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { registerDeletedHandler } from "./src/lib/api";
import SignInScreen from "./src/screens/SignInScreen";
import FeedScreen from "./src/screens/FeedScreen";
import AddScreen from "./src/screens/AddScreen";
import ShelfScreen from "./src/screens/ShelfScreen";
import SearchScreen from "./src/screens/SearchScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import DeletedAccountScreen from "./src/screens/DeletedAccountScreen";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const Tab = createBottomTabNavigator();

function AddButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Feather name="plus" size={24} color={colors.primaryFg} />
    </TouchableOpacity>
  );
}

function AppTabs() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarStyle: {
            borderTopColor: colors.tabBorder,
            backgroundColor: colors.tabBg,
            height: 60,
            paddingBottom: 8,
          },
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: color + "22" }]}>
              <Feather name="list" size={20} color={color} />
            </View>
          )}}
        />
        <Tab.Screen
          name="Shelf"
          component={ShelfScreen}
          options={{ tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: color + "22" }]}>
              <Feather name="book-open" size={20} color={color} />
            </View>
          )}}
        />
        <Tab.Screen
          name="Add"
          component={AddScreen}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: (props) => <AddButton onPress={() => props.onPress?.()} />,
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: color + "22" }]}>
              <Feather name="search" size={20} color={color} />
            </View>
          )}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: color + "22" }]}>
              <Feather name="settings" size={20} color={color} />
            </View>
          )}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const [deletedAt, setDeletedAt] = useState<string | null>(null);

  useEffect(() => {
    // Register once. Any apiFetch call that gets a 403 "account_deleted" fires this.
    registerDeletedHandler((ts) => setDeletedAt(ts));
    return () => registerDeletedHandler(null);
  }, []);

  // Reset deleted state when user signs out and back in
  useEffect(() => {
    if (!isSignedIn) setDeletedAt(null);
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isSignedIn) return <SignInScreen />;

  if (deletedAt !== null) {
    return (
      <DeletedAccountScreen
        deletedAt={deletedAt}
        onRecovered={() => setDeletedAt(null)}
      />
    );
  }

  return <AppTabs />;
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
