import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { parsePlantCode } from "@/lib/plant";
import { colors } from "@/theme";

export default function ScanScreen() {
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState("");
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );

  function openCode(raw: string) {
    const code = parsePlantCode(raw);
    if (!code || locked.current) return;
    locked.current = true;
    router.push(`/scan/${encodeURIComponent(code)}`);
  }

  if (!permission) return <View style={styles.empty} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission} edges={["top", "bottom"]}>
        <Text style={styles.title}>Scan a plant tag</Text>
        <Text style={styles.body}>The camera reads the QR code on a tagged plant and opens its record.</Text>
        <Button label="Allow camera" onPress={requestPermission} />
        <ManualEntry value={manual} onChange={setManual} onOpen={openCode} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fill}>
      {focused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => openCode(data)}
        />
      ) : null}
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]} pointerEvents="box-none">
        <Text style={styles.overlayTitle}>Point at a plant tag</Text>
        <View style={styles.frame} />
        <Pressable accessibilityRole="button" style={styles.torch} onPress={() => setTorch((value) => !value)}>
          <Text style={styles.torchText}>{torch ? "Torch on" : "Torch off"}</Text>
        </Pressable>
        <ManualEntry value={manual} onChange={setManual} onOpen={openCode} />
      </SafeAreaView>
    </View>
  );
}

function ManualEntry({
  value,
  onChange,
  onOpen,
}: {
  value: string;
  onChange: (value: string) => void;
  onOpen: (value: string) => void;
}) {
  return (
    <View style={styles.manual}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Or type the tag code"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Button label="Open tag" tone="secondary" disabled={!value.trim()} onPress={() => onOpen(value)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  empty: { flex: 1, backgroundColor: colors.paper },
  permission: { flex: 1, backgroundColor: colors.paper, padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink, marginTop: 12 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  overlay: { flex: 1, justifyContent: "space-between", padding: 16 },
  overlayTitle: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  frame: {
    alignSelf: "center",
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  torch: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  torchText: { color: "#fff", fontWeight: "700" },
  manual: { gap: 8, backgroundColor: colors.card, borderRadius: 16, padding: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: colors.ink,
  },
});
