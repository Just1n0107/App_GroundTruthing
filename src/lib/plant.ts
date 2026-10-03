import type { FieldInput } from "@/types";

export function staffEmail(loginId: string) {
  const trimmed = loginId.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed.toLowerCase()}@staff.plantrecords.com`;
}

export function parsePlantCode(raw: string) {
  const text = raw.trim();
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => part.toLowerCase() === "p");
    const code = marker >= 0 ? parts[marker + 1] : undefined;
    if (code) return decodeURIComponent(code);
  } catch {
    // The scanner can also return the bare tag code.
  }
  const match = text.match(/\/p\/([^/?#\s]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]);
  return text;
}

export function qrCodeForRecord(uuid: string) {
  return `plant-${uuid.slice(0, 8)}`;
}

export function plantQrValue(code: string, siteUrl: string) {
  const site = siteUrl.replace(/\/$/, "");
  return site ? `${site}/p/${code}` : code;
}

export function numberOrNull(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function textOrNull(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function invalidNumber(value: string) {
  const text = value.trim();
  if (!text) return false;
  return !Number.isFinite(Number(text));
}

export function fieldProblems(input: FieldInput) {
  const problems: string[] = [];
  if (invalidNumber(input.height_m)) problems.push("Height must be a number.");
  if (invalidNumber(input.trunk_diameter_cm)) problems.push("Trunk diameter must be a number.");
  if (invalidNumber(input.latitude)) problems.push("Latitude must be a number.");
  if (invalidNumber(input.longitude)) problems.push("Longitude must be a number.");
  return problems;
}

export function roleLabel(role: string) {
  switch (role) {
    case "botanist":
      return "Botanist";
    case "conservation_officer":
      return "Conservation officer";
    case "administrator":
      return "Administrator";
    case "visitor":
      return "Visitor";
    default:
      return role;
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "needs_revision":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function formatWhen(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function speciesTitle(species: { code: string; scientific_name: string; common_name?: string | null }) {
  const common = species.common_name ? ` (${species.common_name})` : "";
  return `${species.code} · ${species.scientific_name}${common}`;
}
