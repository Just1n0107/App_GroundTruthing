import { Tabs } from "expo-router";
import { usePreferences } from "@/lib/preferences";

export default function TabLayout() {
  const { palette, t } = usePreferences();
  return (
    <Tabs
      initialRouteName="field"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.forest,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.tab,
          borderTopColor: "transparent",
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="field" options={{ title: t.field }} />
      <Tabs.Screen name="records" options={{ title: t.recordsTab }} />
      <Tabs.Screen name="species" options={{ title: t.speciesTab }} />
      <Tabs.Screen name="scan" options={{ title: t.scanTab }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="plants" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
