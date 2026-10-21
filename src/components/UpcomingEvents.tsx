import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { Locale } from "@/lib/copy";
import type { PublicEvent } from "@/lib/events";
import { formatParkWhen } from "@/lib/park-time";
import { displayUri } from "@/lib/photos";
import { usePreferences } from "@/lib/preferences";

const SLIDE_MS = 5000;

export function UpcomingEvents({
  title,
  hint,
  empty,
  events,
  note,
  locale,
  manageLabel,
  onManage,
}: {
  title: string;
  hint: string;
  empty: string;
  events: PublicEvent[];
  note: string | null;
  locale: Locale;
  manageLabel?: string;
  onManage?: () => void;
}) {
  const { t } = usePreferences();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [photo, setPhoto] = useState<{ path: string; uri: string | null } | null>(null);
  const slide = events.length > 0 ? events[index % events.length] : undefined;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (events.length < 2 || paused || reduceMotion) return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % events.length);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [events.length, index, paused, reduceMotion]);

  useEffect(() => {
    if (!slide?.image_path) return;
    let cancelled = false;
    const path = slide.image_path;
    displayUri(path)
      .then((uri) => {
        if (!cancelled) setPhoto({ path, uri });
      })
      .catch(() => {
        if (!cancelled) setPhoto({ path, uri: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slide?.image_path]);

  const shownPhoto = slide?.image_path && photo?.path === slide.image_path ? photo.uri : null;

  return (
    <View style={styles.block}>
      {onManage && manageLabel ? (
        <Pressable accessibilityRole="button" onPress={onManage} style={styles.manageHit}>
          <Text style={styles.manage}>{manageLabel}</Text>
        </Pressable>
      ) : null}
      <View style={styles.banner}>
        {shownPhoto ? <Image source={{ uri: shownPhoto }} style={styles.photo} contentFit="cover" /> : null}
        {shownPhoto ? <View style={styles.scrim} /> : null}
        {note || !slide ? (
          <View style={styles.copy}>
            <Text style={styles.label}>{title}</Text>
            <Text style={styles.quiet}>{note || empty}</Text>
            {!note ? <Text style={styles.quiet}>{hint}</Text> : null}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPressIn={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
            onPress={() => router.push({ pathname: "/e/[id]", params: { id: slide.id } })}
            style={styles.slide}
          >
            <View style={styles.copy}>
              <Text style={styles.label}>{title}</Text>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {slide.title}
              </Text>
              <Text style={styles.when} numberOfLines={2}>
                {formatParkWhen(slide.starts_at, slide.ends_at, locale)}
                {slide.location_name ? ` · ${slide.location_name}` : ""}
              </Text>
              {slide.description ? (
                <Text style={styles.quiet} numberOfLines={2}>
                  {slide.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.view}>
              <Text style={styles.viewText}>{t.viewEvent}</Text>
            </View>
          </Pressable>
        )}
        {events.length > 1 ? (
          <View style={styles.dots}>
            {events.map((event, dot) => {
              const selected = dot === index % events.length;
              return (
                <Pressable
                  key={event.id}
                  accessibilityRole="button"
                  accessibilityLabel={event.title}
                  onPress={() => setIndex(dot)}
                  hitSlop={8}
                  style={[styles.dot, selected && styles.dotSelected]}
                />
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  manageHit: { alignSelf: "flex-end" },
  manage: { color: "#1e4d38", fontSize: 15, fontWeight: "700" },
  banner: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#143528",
    padding: 18,
    gap: 14,
    minHeight: 156,
  },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  scrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(14, 36, 28, 0.72)" },
  slide: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 4 },
  label: { color: "#c9e6d4", fontSize: 13, fontWeight: "700" },
  eventTitle: { color: "#f7fbf8", fontSize: 26, fontWeight: "700" },
  when: { color: "rgba(247, 251, 248, 0.86)", fontSize: 14 },
  quiet: { color: "rgba(247, 251, 248, 0.72)", fontSize: 14, lineHeight: 20 },
  view: { backgroundColor: "#f7fbf8", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  viewText: { color: "#1e4d38", fontSize: 14, fontWeight: "700" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(247, 251, 248, 0.4)" },
  dotSelected: { backgroundColor: "#f7fbf8" },
});
