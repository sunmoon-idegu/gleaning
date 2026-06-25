import { useOAuth, useSignInWithApple } from "@clerk/clerk-expo";
import { Image, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, AntDesign } from "@expo/vector-icons";

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e) {
      console.error("Google OAuth error", e);
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleAppleSignIn() {
    setLoadingApple(true);
    try {
      const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        console.error("Apple sign-in error", e);
      }
    } finally {
      setLoadingApple(false);
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
      <View style={styles.buttons}>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.fg }]}
            onPress={handleAppleSignIn}
            disabled={loadingApple}
          >
            {loadingApple ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <View style={styles.iconWrap}><Ionicons name="logo-apple" size={20} color={colors.bg} /></View>
                <Text style={[styles.buttonText, { color: colors.bg }]}>{t("signIn.appleButton")}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.fg }]}
          onPress={handleGoogleSignIn}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <>
              <View style={styles.iconWrap}><AntDesign name="google" size={18} color={colors.bg} /></View>
              <Text style={[styles.buttonText, { color: colors.bg }]}>{t("signIn.button")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
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
  buttons: {
    alignSelf: "stretch",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  iconWrap: {
    position: "absolute",
    left: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
