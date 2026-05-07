"use client";

import * as React from "react";
import { Loader2, ScanLine, ChevronDown } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ACTION_HINTS,
  ACTION_LABELS,
  ACTION_TYPES,
  NFC_TYPES,
  newCardInputSchema,
  type ActionType,
  type NewCardInput,
  type NfcType,
} from "@/lib/types";
import { getNfcSupport, normalizeUid, scanOnce } from "@/lib/nfc";
import { useToast } from "@/components/ui/toast";

type Errors = Partial<Record<keyof NewCardInput, string>>;

export function CardForm({
  initial,
  submitLabel = "Kaart opslaan",
  onSubmit,
}: {
  initial?: Partial<NewCardInput>;
  submitLabel?: string;
  onSubmit: (data: NewCardInput) => Promise<void> | void;
}) {
  const { push } = useToast();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [uid, setUid] = React.useState(initial?.uid ?? "");
  const [nfcType, setNfcType] = React.useState<NfcType>(
    (initial?.nfcType as NfcType) ?? "NTAG215",
  );
  const [actionType, setActionType] = React.useState<ActionType>(
    (initial?.actionType as ActionType) ?? "open_link",
  );
  const [actionValue, setActionValue] = React.useState(initial?.actionValue ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);

  async function handleScan() {
    const support = getNfcSupport();
    if (!support.supported) {
      push({
        title: "NFC niet beschikbaar",
        description: support.reason,
        variant: "error",
      });
      return;
    }
    setScanning(true);
    try {
      const result = await scanOnce();
      const cleaned = normalizeUid(result.uid);
      setUid(cleaned);
      push({
        title: "NFC-tag gelezen",
        description: `UID: ${cleaned}`,
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Scannen mislukt",
        description: err instanceof Error ? err.message : String(err),
        variant: "error",
      });
    } finally {
      setScanning(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const candidate: NewCardInput = {
      name,
      uid: normalizeUid(uid),
      nfcType,
      actionType,
      actionValue,
      notes,
    };
    const parsed = newCardInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof NewCardInput;
        errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="fms-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Kaartgegevens
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="fms-label">Naam</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Toegang voordeur"
              maxLength={80}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <label className="fms-label">NFC type</label>
            <div className="relative">
              <Select
                value={nfcType}
                onChange={(e) => setNfcType(e.target.value as NfcType)}
              >
                {NFC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="fms-label">UID / Tag-ID</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="04:A2:1B:C9:7E:80 of handmatig invoeren"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                {scanning ? "Houd kaart vast…" : "Scan UID"}
              </Button>
            </div>
            {errors.uid ? (
              <p className="mt-1 text-xs text-red-600">{errors.uid}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Web NFC scant alleen op Android Chrome. Anders kun je de UID
                handmatig invoeren of via de helper-API doorsturen.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fms-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Actie
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="fms-label">Type actie</label>
            <div className="relative">
              <Select
                value={actionType}
                onChange={(e) =>
                  setActionType(e.target.value as ActionType)
                }
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ACTION_LABELS[t]}
                  </option>
                ))}
              </Select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="fms-label">Waarde</label>
            <Input
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder={ACTION_HINTS[actionType]}
            />
            {errors.actionValue ? (
              <p className="mt-1 text-xs text-red-600">{errors.actionValue}</p>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="fms-label">Notities</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionele context, locatie, eigenaar…"
              maxLength={500}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
