import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";

interface Props {
  deletedAt: string;
  onRecovered: () => void;
}

export default function DeletedAccountScreen({ deletedAt, onRecovered }: Props) {
  const { signOut, getToken } = useAuth();
  const [recovering, setRecovering] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.fg }]}>{t("deleted.title")}</Text>
        <Text style={[styles.body, { color: colors.mutedFg }]}>{t("deleted.body", { date: purgeDateStr })}</Text>

        <TouchableOpacity
          style={[styles.recoverBtn, { backgroundColor: colors.fg }, recovering && styles.disabled]}
          onPress={handleRecover}
          disabled={recovering}
          activeOpacity={0.8}
        >
          {recovering
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={[styles.recoverText, { color: colors.bg }]}>{t("deleted.recover")}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()} activeOpacity={0.7}>
          <Text style={[styles.signOutText, { color: colors.mutedFg }]}>{t("deleted.signOut")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  title: { fontSize: 26, fontWeight: "700", lineHeight: 34 },
  body: { fontSize: 15, lineHeight: 24 },
  recoverBtn: {
    borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  disabled: { opacity: 0.5 },
  recoverText: { fontSize: 16, fontWeight: "600" },
  signOutBtn: { alignItems: "center", paddingVertical: 12 },
  signOutText: { fontSize: 14 },
});
