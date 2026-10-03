import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Notice } from "@/components/ui";
import { listDrafts, listRecords } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/plant";
import { colors } from "@/theme";
import type { CachedRecord, Draft } from "@/types";

export default function FieldHome() {
  const { profile, online, pending, notice, syncing, syncNow, signOut, version } = useAuth();
  const [records, setRecords] = useState<CachedRecord[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    listRecords(profile.uuid).then((rows) => setRecords(rows.slice(0, 4))).catch(() => setRecords([]));
    listDrafts(profile.uuid).then((rows) => setDrafts(rows.slice(0, 3))).catch(() => setDrafts([]));
  }, [profile, version, pending]);

  if (!profile) return null;
  const botanist = profile.role === "botanist";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await syncNow();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.kicker}>Niah National Park</Text>
        <Text style={styles.title}>Field book</Text>
        <Text style={styles.identity}>
          {profile.name} · {profile.id} · {roleLabel(profile.role)}
        </Text>
        <Notice tone={online ? "ok" : "warn"}>
          {online
            ? "Connected. Saved records can upload to the central database."
            : "No connection. You can still record plants, search the saved species guide, and keep GPS readings on this phone."}
        </Notice>
        {notice && <Notice>{notice}</Notice>}
        {botanist ? (
          <Button label="Register a plant" onPress={() => router.push("/records/new")} />
        ) : (
          <Notice>Field records are collected by botanists. You can search the species guide and scan plant tags.</Notice>
        )}
        <View style={styles.actions}>
          <Button label="Scan a tag" tone="secondary" onPress={() => router.push("/scan")} />
          <Button label="Species guide" tone="secondary" onPress={() => router.push("/species")} />
        </View>
        {botanist && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{pending === 0 ? "Nothing waiting to upload" : `${pending} waiting to upload`}</Text>
            {drafts.map((draft) => (
              <Text key={draft.local_id} style={styles.line}>
                {draft.species_label || "Unidentified"}
                {draft.location_name ? ` · ${draft.location_name}` : ""}
              </Text>
            ))}
            <Button label={syncing ? "Uploading…" : "Upload now"} disabled={syncing} onPress={syncNow} />
          </View>
        )}
        {botanist && records.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent records</Text>
            {records.map((record) => (
              <Pressable key={record.uuid} style={styles.record} onPress={() => router.push(`/records/${record.uuid}`)}>
                <Text style={styles.line}>{record.code ? `${record.code} · ` : ""}{record.species_name || "Unidentified"}</Text>
                <Badge status={record.status} />
              </Pressable>
            ))}
          </View>
        )}
        <Button label="Sign out" tone="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  kicker: { color: colors.leaf, fontWeight: "700" },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink },
  identity: { color: colors.muted, fontSize: 15 },
  actions: { gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  line: { color: colors.ink, fontSize: 15 },
  record: { gap: 4, paddingVertical: 6 },
});
