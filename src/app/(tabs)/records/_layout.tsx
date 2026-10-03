import { Stack } from "expo-router";
import { headerOptions } from "@/theme";

export default function RecordsLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: "My records" }} />
      <Stack.Screen name="new" options={{ title: "New record" }} />
      <Stack.Screen name="[id]" options={{ title: "Plant record" }} />
      <Stack.Screen name="draft/[id]" options={{ title: "On this phone" }} />
    </Stack>
  );
}
