import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { Muted, Notice } from "@/components/ui";
import { listSpecies } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { colors } from "@/theme";
import type { Species } from "@/types";

export default function SpeciesScreen() {
  const { syncNow, version } = useAuth();
  const [species, setSpecies] = useState<Species[]>([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    listSpecies().then(setSpecies).catch(() => setSpecies([]));
  }, [version]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return species;
    return species.filter((item) => {
      const blob = `${item.code} ${item.scientific_name} ${item.common_name ?? ""} ${item.local_name ?? ""} ${item.family ?? ""} ${item.genus ?? ""}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [query, species]);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(item) => item.uuid}
      keyboardShouldPersistTaps="handled"
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
          <Text style={styles.intro}>Search the identification reference saved on this phone. Open it once while online to refresh the guide.</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Scientific, common, or local name"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
        </View>
      }
      ListEmptyComponent={<Notice>{species.length === 0 ? "No species are saved on this phone yet." : "No species match that search."}</Notice>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/species/${item.uuid}`)}>
          <Text style={styles.name}>{item.scientific_name}</Text>
          <Muted>
            {item.code}
            {item.common_name ? ` · ${item.common_name}` : " · No common name"}
            {item.conservation_status ? ` · ${item.conservation_status}` : ""}
          </Muted>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  header: { gap: 12, marginBottom: 12 },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 16,
  },
  row: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  name: { color: colors.ink, fontSize: 16, fontWeight: "700" },
});
