import { useOAuth } from "@clerk/clerk-expo";
import { Image, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();

  async function handleSignIn() {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e) {
      console.error("OAuth error", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Image source={require("../../assets/favicon.png")} style={styles.logo} />
          <Text style={[styles.title, { color: colors.fg }]}>Gleaning</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedFg }]}>{t("signIn.subtitle")}</Text>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.fg }]} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.bg }]}>{t("signIn.button")}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 64,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
