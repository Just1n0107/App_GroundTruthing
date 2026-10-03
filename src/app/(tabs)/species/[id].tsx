import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Fact, Notice, Screen } from "@/components/ui";
import { getSpecies } from "@/lib/db";
import { firstParam } from "@/lib/plant";
import { colors } from "@/theme";
import type { Species } from "@/types";

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const speciesId = firstParam(id);
  const [species, setSpecies] = useState<Species | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getSpecies(speciesId).then((row) => {
      setSpecies(row);
      setMissing(!row);
    });
  }, [speciesId]);

  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This species is not in the guide saved on this phone.</Notice>
      </Screen>
    );
  }
  if (!species) return null;

  const names = [species.common_name, species.local_name].filter(Boolean).join(" · ");

  return (
    <Screen>
      <Text style={styles.rank}>{[species.family, species.genus].filter(Boolean).join(" · ")}</Text>
      <Text style={styles.name}>{species.scientific_name}</Text>
      {names ? <Text style={styles.meta}>{names}</Text> : null}
      <Fact label="Code" value={species.code} />
      <Fact label="Conservation status" value={species.conservation_status} />
      <Fact label="Distribution" value={species.distribution} />
      <Fact label="Description" value={species.description} />
      <Fact label="Ecology" value={species.ecological_info} />
      <Fact label="Cultural significance" value={species.cultural_significance} />
      {species.photos.map((photo, index) => (
        <View key={`${photo.storage_path}-${index}`} style={styles.photoBlock}>
          <Image source={{ uri: photo.storage_path }} style={styles.photo} contentFit="cover" />
          {photo.caption ? <Text style={styles.meta}>{photo.caption}</Text> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rank: { color: colors.leaf, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 15 },
  photoBlock: { gap: 6 },
  photo: { width: "100%", height: 220, borderRadius: 16, backgroundColor: colors.sand },
});
