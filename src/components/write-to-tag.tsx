"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  buildRecordsForAction,
  getNfcSupport,
  isStandaloneAction,
  writeToTag,
} from "@/lib/nfc";
import { ACTION_LABELS, type NfcCard } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "writing" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function WriteToTagButton({
  card,
  className,
  size,
}: {
  card: NfcCard;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const { push } = useToast();
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const acRef = React.useRef<AbortController | null>(null);

  const support = React.useMemo(() => getNfcSupport(), []);
  const standalone = isStandaloneAction(card.actionType);

  function close() {
    acRef.current?.abort();
    setState({ kind: "idle" });
  }

  async function handleWrite() {
    if (!card.actionValue && card.actionType !== "show_text") {
      push({
        title: "Geen waarde ingesteld",
        description: "Stel eerst een actie-waarde in voordat je schrijft.",
        variant: "error",
      });
      return;
    }
    if (!support.supported) {
      push({
        title: "NFC niet beschikbaar",
        description: support.reason,
        variant: "error",
      });
      return;
    }

    const records = buildRecordsForAction(card.actionType, card.actionValue);
    setState({ kind: "writing" });
    const ac = new AbortController();
    acRef.current = ac;
    try {
      await writeToTag(records, { signal: ac.signal, overwrite: true });
      setState({ kind: "success" });
      push({
        title: "Geschreven naar kaart",
        description: `"${card.name}" is naar de NFC-kaart geschreven.`,
        variant: "success",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ kind: "error", message: msg });
    } finally {
      acRef.current = null;
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="default"
        className={className}
        size={size}
        onClick={handleWrite}
        disabled={state.kind === "writing"}
      >
        {state.kind === "writing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Schrijf naar kaart
      </Button>

      {state.kind !== "idle" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            {state.kind === "writing" ? (
              <>
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 animate-ping-slow rounded-full bg-brand-200/60" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                    <Radio className="h-7 w-7" />
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">
                  Houd de kaart bij je telefoon
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plaats de NTAG-kaart tegen de bovenkant of achterkant van je
                  toestel. Chrome vraagt mogelijk om toestemming.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Schrijven: <span className="font-medium">{card.name}</span> ·{" "}
                  {ACTION_LABELS[card.actionType]}
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={close}
                >
                  <XCircle className="h-4 w-4" /> Annuleren
                </Button>
              </>
            ) : null}

            {state.kind === "success" ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-semibold">Klaar!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  De kaart is geschreven. {standalone ? (
                    "Tap de kaart op je telefoon en de actie start automatisch — geen webapp nodig."
                  ) : (
                    "Let op: deze actie heeft de webapp nodig om uit te voeren."
                  )}
                </p>
                <Button className="mt-5 w-full" onClick={close}>
                  Sluiten
                </Button>
              </>
            ) : null}

            {state.kind === "error" ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-red-700">
                  Schrijven mislukt
                </h3>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {state.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Mogelijke oorzaken: kaart te ver weg, kaart vergrendeld
                  (read-only), te weinig geheugen, of geen toestemming gegeven.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button className="flex-1" onClick={handleWrite}>
                    Opnieuw
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={close}
                  >
                    Sluiten
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
