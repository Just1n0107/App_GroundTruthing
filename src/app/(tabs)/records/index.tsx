import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Badge, Muted, Notice } from "@/components/ui";
import { listDrafts, listRecords } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { formatWhen } from "@/lib/plant";
import { colors } from "@/theme";
import type { CachedRecord, Draft } from "@/types";

export default function RecordsScreen() {
  const { profile, syncNow, version, pending } = useAuth();
  const [records, setRecords] = useState<CachedRecord[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile || version < 0 || pending < 0) return;
      let cancelled = false;
      Promise.all([listRecords(profile.uuid), listDrafts(profile.uuid)])
        .then(([nextRecords, nextDrafts]) => {
          if (cancelled) return;
          setRecords(nextRecords);
          setDrafts(nextDrafts);
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, [pending, profile, version]),
  );

  if (!profile) return null;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={records}
      keyExtractor={(item) => item.uuid}
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
      ListHeaderComponent={
        <View style={styles.header}>
          {profile.role === "botanist" && (
            <Pressable accessibilityRole="button" style={styles.newButton} onPress={() => router.push("/records/new")}>
              <Text style={styles.newButtonText}>New record</Text>
            </Pressable>
          )}
          {drafts.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.heading}>Waiting on this phone</Text>
              {drafts.map((draft) => (
                <Pressable key={draft.local_id} style={styles.row} onPress={() => router.push(`/records/draft/${draft.local_id}`)}>
                  <Text style={styles.name}>{draft.species_label || "Unidentified"}</Text>
                  <Muted>{draft.sync_error || draft.location_name || "Not uploaded yet"}</Muted>
                </Pressable>
              ))}
            </View>
          )}
          {records.length > 0 && <Text style={styles.heading}>Uploaded records</Text>}
        </View>
      }
      ListEmptyComponent={
        drafts.length === 0 ? (
          <Notice>
            {profile.role === "botanist"
              ? "No records on this phone yet. Register a plant while you are in the field."
              : "Botanist field records appear here after that botanist signs in."}
          </Notice>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/records/${item.uuid}`)}>
          <Text style={styles.name}>
            {item.code ? `${item.code} · ` : ""}
            {item.species_name || "Unidentified"}
          </Text>
          <Muted>
            {item.location_name || "No place name"}
            {item.recorded_at ? ` · ${formatWhen(item.recorded_at)}` : ""}
          </Muted>
          <Badge status={item.status} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, gap: 10 },
  header: { gap: 12, marginBottom: 8 },
  newButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  newButtonText: { color: "#fffdf8", fontWeight: "700", fontSize: 16 },
  block: { gap: 8 },
  heading: { fontSize: 16, fontWeight: "700", color: colors.ink },
  row: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  name: { color: colors.ink, fontSize: 16, fontWeight: "600" },
});
