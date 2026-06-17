import { useOAuth } from "@clerk/clerk-expo";
import { Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Gleaning</Text>
      <Text style={styles.subtitle}>Capture what's worth keeping.</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
