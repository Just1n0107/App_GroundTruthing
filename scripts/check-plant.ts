import assert from "node:assert/strict";
import {
  fieldProblems,
  numberOrNull,
  parsePlantCode,
  plantQrValue,
  qrCodeForRecord,
  staffEmail,
  textOrNull,
} from "../src/lib/plant.ts";

assert.equal(staffEmail("B001"), "b001@staff.plantrecords.com");
assert.equal(staffEmail(" O002 "), "o002@staff.plantrecords.com");
assert.equal(staffEmail("botanist@staff.plantrecords.com"), "botanist@staff.plantrecords.com");

assert.equal(parsePlantCode("plant-abc123"), "plant-abc123");
assert.equal(parsePlantCode("https://records.example/p/plant-abc123"), "plant-abc123");
assert.equal(parsePlantCode("https://records.example/p/plant-abc123?from=tag"), "plant-abc123");
assert.equal(parsePlantCode("http://localhost:3000/p/plant-deadbeef/"), "plant-deadbeef");

assert.equal(qrCodeForRecord("12345678-aaaa-bbbb-cccc-ddddeeeeffff"), "plant-12345678");
assert.equal(plantQrValue("plant-12345678", "https://records.example/"), "https://records.example/p/plant-12345678");
assert.equal(plantQrValue("plant-12345678", ""), "plant-12345678");

assert.equal(numberOrNull(" 1.5 "), 1.5);
assert.equal(numberOrNull(""), null);
assert.equal(numberOrNull("no"), null);
assert.equal(textOrNull("  "), null);
assert.equal(textOrNull(" leaf "), "leaf");

assert.deepEqual(
  fieldProblems({
    species_id: null,
    species_label: "",
    height_m: "abc",
    trunk_diameter_cm: "",
    latitude: "3.8",
    longitude: "bad",
    location_name: "",
    leaf_traits: "",
    flower_fruit_traits: "",
    health_status: "",
    other_traits: "",
    photo_uri: null,
    photo_caption: "",
    status: "submitted",
  }),
  ["Height must be a number.", "Longitude must be a number."],
);

console.log("plant helpers ok");
