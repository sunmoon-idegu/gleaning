import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

interface Props {
  deletedAt: string;          // ISO string from the 403 response
  onRecovered: () => void;    // called after successful recovery
}

export default function DeletedAccountScreen({ deletedAt, onRecovered }: Props) {
  const { signOut, getToken } = useAuth();
  const [recovering, setRecovering] = useState(false);
  const { t } = useTranslation();

  const purgeDate = deletedAt ? new Date(deletedAt) : new Date();
  purgeDate.setDate(purgeDate.getDate() + 30);
  const purgeDateStr = purgeDate.toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  async function handleRecover() {
    setRecovering(true);
    try {
      const token = await getToken();
      if (!token) throw new Error();
      await apiFetch("/users/me/recover", token, { method: "POST" });
      onRecovered();
    } catch {
      Alert.alert(t("deleted.errorTitle"), t("deleted.errorMessage"));
    } finally {
      setRecovering(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        <Text style={styles.title}>{t("deleted.title")}</Text>
        <Text style={styles.body}>{t("deleted.body", { date: purgeDateStr })}</Text>

        <TouchableOpacity
          style={[styles.recoverBtn, recovering && styles.disabled]}
          onPress={handleRecover}
          disabled={recovering}
          activeOpacity={0.8}
        >
          {recovering
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.recoverText}>{t("deleted.recover")}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()} activeOpacity={0.7}>
          <Text style={styles.signOutText}>{t("deleted.signOut")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#111", lineHeight: 34 },
  body: { fontSize: 15, color: "#555", lineHeight: 24 },
  date: { fontWeight: "600", color: "#111" },
  recoverBtn: {
    backgroundColor: "#111", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  disabled: { opacity: 0.5 },
  recoverText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  signOutBtn: { alignItems: "center", paddingVertical: 12 },
  signOutText: { color: "#888", fontSize: 14 },
});
