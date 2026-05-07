import { z } from "zod";

export const NFC_TYPES = ["NTAG213", "NTAG215", "NTAG216", "Unknown"] as const;
export type NfcType = (typeof NFC_TYPES)[number];

export const ACTION_TYPES = [
  "open_link",
  "show_text",
  "open_file",
  "check_in",
  "open_profile",
  "webhook",
  "custom",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_LABELS: Record<ActionType, string> = {
  open_link: "Link openen",
  show_text: "Tekst tonen",
  open_file: "Bestand / download",
  check_in: "Check-in registreren",
  open_profile: "Persoon / profiel",
  webhook: "Webhook / API-call",
  custom: "Custom actie",
};

export const ACTION_HINTS: Record<ActionType, string> = {
  open_link: "Bijv. https://example.com",
  show_text: "Bijv. 'Welkom op kantoor'",
  open_file: "URL naar PDF, afbeelding of download",
  check_in: "Naam van check-in punt of locatie",
  open_profile: "Profiel-ID of URL",
  webhook: "POST endpoint URL",
  custom: "JSON-config of vrije tekst",
};

export const cardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Naam is verplicht").max(80),
  uid: z
    .string()
    .min(4, "UID moet minstens 4 tekens zijn")
    .max(64)
    .regex(/^[A-Za-z0-9:\-]+$/u, "Alleen letters, cijfers, : en -"),
  nfcType: z.enum(NFC_TYPES),
  actionType: z.enum(ACTION_TYPES),
  actionValue: z.string().max(2000).default(""),
  notes: z.string().max(500).optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastScannedAt: z.string().nullable().default(null),
  scanCount: z.number().int().nonnegative().default(0),
});
export type NfcCard = z.infer<typeof cardSchema>;

export const newCardInputSchema = cardSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastScannedAt: true,
    scanCount: true,
  })
  .extend({
    notes: z.string().max(500).optional().default(""),
  });
export type NewCardInput = z.infer<typeof newCardInputSchema>;

export const settingsSchema = z.object({
  autoExecute: z.boolean().default(false),
  hapticFeedback: z.boolean().default(true),
  helperUrl: z.string().url().or(z.literal("")).default(""),
  duplicateUidPolicy: z.enum(["block", "warn", "allow"]).default("warn"),
});
export type Settings = z.infer<typeof settingsSchema>;
