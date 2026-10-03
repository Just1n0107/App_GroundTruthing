import { Stack } from "expo-router";
import { headerOptions } from "@/theme";

export default function SpeciesLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: "Species guide" }} />
      <Stack.Screen name="[id]" options={{ title: "Species" }} />
    </Stack>
  );
}
