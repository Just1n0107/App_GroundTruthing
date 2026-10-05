import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PlantPhoto } from "@/components/PlantPhoto";
import { Button, Field, Notice } from "@/components/ui";
import { listSpecies } from "@/lib/db";
import { copyPhotoIntoApp } from "@/lib/photos";
import { fieldProblems, speciesTitle } from "@/lib/plant";
import { colors } from "@/theme";
import type { FieldInput, Species } from "@/types";

const emptyInput: FieldInput = {
  species_id: null,
  species_label: "",
  height_m: "",
  trunk_diameter_cm: "",
  latitude: "",
  longitude: "",
  location_name: "",
  leaf_traits: "",
  flower_fruit_traits: "",
  health_status: "",
  other_traits: "",
  photo_uri: null,
  photo_caption: "",
  status: "submitted",
};

export function RecordForm({
  localId,
  initial,
  mode,
  submitLabel,
  onSubmit,
}: {
  localId: string;
  initial?: Partial<FieldInput>;
  mode: "create" | "revise";
  submitLabel: string;
  onSubmit: (input: FieldInput) => Promise<string | null>;
}) {
  const [input, setInput] = useState<FieldInput>({ ...emptyInput, ...initial });
  const [species, setSpecies] = useState<Species[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    listSpecies().then(setSpecies).catch(() => setSpecies([]));
  }, []);

  function patch(values: Partial<FieldInput>) {
    setInput((current) => ({ ...current, ...values }));
  }

  async function useLocation() {
    setMessage(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setMessage("Location permission is required to record GPS.");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      patch({
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      });
      setAccuracy(position.coords.accuracy);
    } catch {
      setMessage("Could not read this phone's location.");
    }
  }

  async function takePhoto(source: "camera" | "library") {
    setMessage(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(source === "camera" ? "Camera permission is required to photograph the plant." : "Photo library permission is required.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6 });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    try {
      const stored = await copyPhotoIntoApp(localId, uri);
      patch({ photo_uri: stored });
    } catch {
      patch({ photo_uri: uri });
      setMessage("The photo is attached, but it could not be copied into the field book folder.");
    }
  }

  async function submit() {
    const problems = fieldProblems(input);
    if (problems.length > 0) {
      setMessage(problems[0] ?? "Check the measurements.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const error = await onSubmit(input);
    setSaving(false);
    if (error) setMessage(error);
  }

  const filtered = species.filter((item) => {
    const blob = `${item.code} ${item.scientific_name} ${item.common_name ?? ""} ${item.local_name ?? ""} ${item.family ?? ""}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });

  return (
    <View style={styles.form}>
      {message && <Notice tone="warn">{message}</Notice>}
      <Pressable accessibilityRole="button" style={styles.picker} onPress={() => setPickerOpen(true)}>
        <Text style={styles.pickerLabel}>Species</Text>
        <Text style={styles.pickerValue}>{input.species_label || "Not identified yet"}</Text>
      </Pressable>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Height (m)" value={input.height_m} onChangeText={(height_m) => patch({ height_m })} keyboardType="decimal-pad" />
        </View>
        <View style={styles.half}>
          <Field label="Trunk diameter (cm)" value={input.trunk_diameter_cm} onChangeText={(trunk_diameter_cm) => patch({ trunk_diameter_cm })} keyboardType="decimal-pad" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Latitude" value={input.latitude} onChangeText={(latitude) => patch({ latitude })} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={styles.half}>
          <Field label="Longitude" value={input.longitude} onChangeText={(longitude) => patch({ longitude })} keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      <Button label="Use my location" tone="secondary" onPress={useLocation} />
      {accuracy != null && <Text style={styles.accuracy}>GPS accuracy about {Math.round(accuracy)} m</Text>}
      <Field label="Place name" value={input.location_name} onChangeText={(location_name) => patch({ location_name })} placeholder="Trail, cave mouth, plot" />
      <Field label="Leaf traits" value={input.leaf_traits} onChangeText={(leaf_traits) => patch({ leaf_traits })} multiline />
      <Field label="Flower or fruit" value={input.flower_fruit_traits} onChangeText={(flower_fruit_traits) => patch({ flower_fruit_traits })} multiline />
      <Field label="Health" value={input.health_status} onChangeText={(health_status) => patch({ health_status })} placeholder="Healthy, damaged, flowering" />
      <Field label="Other traits" value={input.other_traits} onChangeText={(other_traits) => patch({ other_traits })} multiline />
      {input.photo_uri ? (
        <View style={styles.photoBlock}>
          <PlantPhoto photo={{ storage_path: input.photo_uri, caption: null }} showCaption={false} />
          <Field label="Photo caption" value={input.photo_caption} onChangeText={(photo_caption) => patch({ photo_caption })} />
          <Button label="Remove photograph" tone="secondary" onPress={() => patch({ photo_uri: null })} />
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.half}>
            <Button label="Take photo" tone="secondary" onPress={() => takePhoto("camera")} />
          </View>
          <View style={styles.half}>
            <Button label="Choose photo" tone="secondary" onPress={() => takePhoto("library")} />
          </View>
        </View>
      )}
      {mode === "create" && (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            style={[styles.choice, input.status === "draft" && styles.choiceOn]}
            onPress={() => patch({ status: "draft" })}
          >
            <Text style={[styles.choiceText, input.status === "draft" && styles.choiceTextOn]}>Keep as draft</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.choice, input.status === "submitted" && styles.choiceOn]}
            onPress={() => patch({ status: "submitted" })}
          >
            <Text style={[styles.choiceText, input.status === "submitted" && styles.choiceTextOn]}>Submit for review</Text>
          </Pressable>
        </View>
      )}
      <Button
        label={saving ? "Saving…" : mode === "create" ? (input.status === "draft" ? "Save on this phone" : "Submit for review") : submitLabel}
        disabled={saving}
        onPress={submit}
      />

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Species guide</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Scientific, common, or local name"
            placeholderTextColor={colors.muted}
            style={styles.search}
            autoFocus
          />
          <Pressable
            style={styles.speciesRow}
            onPress={() => {
              patch({ species_id: null, species_label: "" });
              setPickerOpen(false);
            }}
          >
            <Text style={styles.speciesName}>Not identified yet</Text>
          </Pressable>
            <FlatList
            style={styles.speciesList}
            data={filtered}
            keyExtractor={(item) => item.uuid}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>No species saved on this phone yet. Open the species guide while online.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.speciesRow}
                onPress={() => {
                  patch({ species_id: item.uuid, species_label: speciesTitle(item) });
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.speciesName}>{item.scientific_name}</Text>
                <Text style={styles.speciesMeta}>
                  {item.code}
                  {item.common_name ? ` · ${item.common_name}` : ""}
                  {item.local_name ? ` · ${item.local_name}` : ""}
                </Text>
              </Pressable>
            )}
          />
          <Button label="Close" tone="secondary" onPress={() => setPickerOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  picker: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  pickerLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  pickerValue: { color: colors.ink, fontSize: 16, marginTop: 2 },
  accuracy: { color: colors.muted, fontSize: 13 },
  photoBlock: { gap: 10 },
  modal: { flex: 1, backgroundColor: colors.paper, padding: 16, gap: 10 },
  modalTitle: { fontSize: 24, fontWeight: "700", color: colors.ink, marginTop: 24 },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    color: colors.ink,
  },
  speciesRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  speciesName: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  speciesMeta: { color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, paddingVertical: 16 },
  speciesList: { flex: 1 },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  choiceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  choiceText: { color: colors.forest, fontWeight: "700", textAlign: "center" },
  choiceTextOn: { color: "#fffdf8" },
});
