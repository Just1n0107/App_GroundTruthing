import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Fact, Notice, Screen } from "@/components/ui";
import { RecordForm } from "@/components/RecordForm";
import { getRecord } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { firstParam, formatWhen, plantQrValue, statusLabel } from "@/lib/plant";
import { generateRecordQr, resubmitRecord } from "@/lib/remote";
import { refreshReferenceData } from "@/lib/sync";
import { siteUrl } from "@/lib/supabase";
import { colors } from "@/theme";
import type { CachedRecord, FieldInput } from "@/types";

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = firstParam(id);
  const { profile, online, syncNow } = useAuth();
  const [record, setRecord] = useState<CachedRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    let row = await getRecord(recordId);
    if (!row && online && profile?.role === "botanist") {
      await refreshReferenceData(profile);
      row = await getRecord(recordId);
    }
    setRecord(row);
    setMissing(!row);
  }, [online, profile, recordId]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setMissing(true));
    }, [load]),
  );

  if (!profile) return null;
  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This record is not on this phone. Connect and refresh your records.</Notice>
      </Screen>
    );
  }
  if (!record) return null;

  const editable = record.status === "draft" || record.status === "needs_revision";
  const qrValue = record.qr_code ? plantQrValue(record.qr_code, siteUrl) : null;

  return (
    <Screen>
      <Text style={styles.name}>{record.species_name || "Unidentified plant"}</Text>
      {record.common_name ? <Text style={styles.meta}>{record.common_name}</Text> : null}
      <Badge status={record.status} />
      {record.code ? <Fact label="Record" value={record.code} /> : null}
      {record.recorded_at ? <Fact label="Recorded" value={formatWhen(record.recorded_at)} /> : null}
      {record.review_note && <Notice tone="warn">Officer note: {record.review_note}</Notice>}
      {message && <Notice tone="danger">{message}</Notice>}

      {editable && profile.role === "botanist" ? (
        <RecordForm
          localId={record.uuid}
          mode="revise"
          submitLabel="Submit again"
          initial={{
            species_id: record.species_id,
            species_label: record.species_name ?? "",
            height_m: record.height_m?.toString() ?? "",
            trunk_diameter_cm: record.trunk_diameter_cm?.toString() ?? "",
            latitude: record.latitude?.toString() ?? "",
            longitude: record.longitude?.toString() ?? "",
            location_name: record.location_name ?? "",
            leaf_traits: record.leaf_traits ?? "",
            flower_fruit_traits: record.flower_fruit_traits ?? "",
            health_status: record.health_status ?? "",
            other_traits: record.other_traits ?? "",
            photo_uri: record.photos[0]?.storage_path ?? null,
            photo_caption: record.photos[0]?.caption ?? "",
            status: "submitted",
          }}
          onSubmit={async (input: FieldInput) => {
            if (!online) return "Connect to the network before updating a record that is already in the central database.";
            const originalPhoto = record.photos[0]?.storage_path ?? null;
            const error = await resubmitRecord(profile.uuid, record.uuid, {
              ...input,
              photo_uri: input.photo_uri === originalPhoto ? null : input.photo_uri,
            });
            if (error) return error;
            await syncNow();
            await load();
            setMessage(null);
            return null;
          }}
        />
      ) : (
        <View style={styles.facts}>
          <Fact label="Place" value={record.location_name} />
          <Fact label="GPS" value={record.latitude != null ? `${record.latitude}, ${record.longitude}` : null} />
          <Fact label="Height (m)" value={record.height_m} />
          <Fact label="Trunk diameter (cm)" value={record.trunk_diameter_cm} />
          <Fact label="Leaves" value={record.leaf_traits} />
          <Fact label="Flower or fruit" value={record.flower_fruit_traits} />
          <Fact label="Health" value={record.health_status} />
          <Fact label="Other" value={record.other_traits} />
          <Fact label="Status" value={statusLabel(record.status)} />
        </View>
      )}

      {record.latitude != null && record.longitude != null && (
        <Button
          label="Open location"
          tone="secondary"
          onPress={() =>
            Linking.openURL(
              `https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=17/${record.latitude}/${record.longitude}`,
            )
          }
        />
      )}

      {record.photos.map((photo, index) => (
        <View key={`${photo.storage_path}-${index}`} style={styles.photoBlock}>
          <Image source={{ uri: photo.storage_path }} style={styles.photo} contentFit="cover" />
          {photo.caption ? <Text style={styles.meta}>{photo.caption}</Text> : null}
        </View>
      ))}

      {record.status === "approved" && !record.qr_code && profile.role === "botanist" && (
        <Button
          label={working ? "Generating…" : "Generate QR code"}
          disabled={working || !online}
          onPress={async () => {
            if (!online) {
              setMessage("Connect to the network before generating a QR code.");
              return;
            }
            setWorking(true);
            const result = await generateRecordQr(record.uuid);
            setWorking(false);
            if (result.error || !result.code) {
              setMessage(result.error ?? "Could not generate a QR code.");
              return;
            }
            setRecord({ ...record, qr_code: result.code });
            await syncNow();
            await load();
          }}
        />
      )}
      {record.status === "approved" && !record.qr_code && !online && (
        <Notice tone="warn">Connect to generate the QR tag after this record is approved.</Notice>
      )}
      {record.status !== "approved" && !record.qr_code && (
        <Notice>A QR tag can be generated after a conservation officer approves this record.</Notice>
      )}
      {qrValue && record.qr_code && (
        <View style={styles.qr}>
          <QRCode value={qrValue} size={180} />
          <Text style={styles.meta}>{record.qr_code}</Text>
          <Text style={styles.meta}>{qrValue}</Text>
          {!siteUrl && (
            <Notice tone="warn">
              Set EXPO_PUBLIC_SITE_URL to the website address so a printed tag opens the public plant page. This code can already be scanned inside the app.
            </Notice>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 28, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 14 },
  facts: { gap: 10 },
  photoBlock: { gap: 6 },
  photo: { width: "100%", height: 220, borderRadius: 16, backgroundColor: colors.sand },
  qr: { alignItems: "flex-start", gap: 8, backgroundColor: "#fff", padding: 12, borderRadius: 16 },
});
