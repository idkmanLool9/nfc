"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  PlayCircle,
  Plus,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getNfcSupport, normalizeUid, scanOnce } from "@/lib/nfc";
import { cardRepository, settingsRepository } from "@/lib/storage";
import type { NfcCard } from "@/lib/types";
import { runAction } from "@/lib/actions";
import { formatDate, shortUid } from "@/lib/utils";

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "done"; uid: string; match: NfcCard | null }
  | { kind: "error"; message: string };

export default function ScanPage() {
  const router = useRouter();
  const { push } = useToast();
  const [state, setState] = React.useState<ScanState>({ kind: "idle" });
  const [manualUid, setManualUid] = React.useState("");
  const [autoExecute, setAutoExecute] = React.useState(false);
  const support = React.useMemo(() => getNfcSupport(), []);

  React.useEffect(() => {
    settingsRepository.get().then((s) => setAutoExecute(s.autoExecute));
  }, []);

  async function handleUid(rawUid: string) {
    const uid = normalizeUid(rawUid);
    if (!uid) {
      setState({ kind: "error", message: "Lege UID." });
      return;
    }
    const match = await cardRepository.findByUid(uid);
    if (match) {
      const updated = await cardRepository.recordScan(uid);
      setState({ kind: "done", uid, match: updated ?? match });
      if (autoExecute && updated) {
        const result = await runAction(updated);
        push({
          title: result.title,
          description: result.description,
          variant: result.ok ? "success" : "error",
        });
      }
    } else {
      setState({ kind: "done", uid, match: null });
    }
  }

  async function startScan() {
    if (!support.supported) return;
    setState({ kind: "scanning" });
    try {
      const result = await scanOnce();
      await handleUid(result.uid);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function reset() {
    setState({ kind: "idle" });
    setManualUid("");
  }

  return (
    <>
      <PageHeader
        title="NFC scannen"
        description="Houd een geregistreerde NTAG-kaart bij je apparaat of voer de UID handmatig in."
        actions={
          <Link href="/cards/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="h-4 w-4" /> Nieuwe kaart
          </Link>
        }
      />

      {!support.supported ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="font-semibold">Web NFC niet beschikbaar</p>
            <p className="mt-0.5 text-amber-800">{support.reason}</p>
            <p className="mt-2 text-amber-800">
              Je kunt nog steeds handmatig een UID invoeren of een desktop
              NFC-reader koppelen via de helper-API. Zie{" "}
              <Link className="underline" href="/settings">
                Instellingen
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="relative">
              {state.kind === "scanning" ? (
                <span className="absolute inset-0 -m-2 animate-ping-slow rounded-full bg-brand-200/60" />
              ) : null}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                {state.kind === "scanning" ? (
                  <Loader2 className="h-9 w-9 animate-spin" />
                ) : state.kind === "done" && state.match ? (
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                ) : state.kind === "error" ? (
                  <AlertTriangle className="h-9 w-9 text-red-600" />
                ) : (
                  <ScanLine className="h-9 w-9" />
                )}
              </div>
            </div>

            {state.kind === "idle" ? (
              <>
                <h2 className="text-lg font-semibold">Klaar om te scannen</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Druk op de knop hieronder en houd vervolgens een NTAG213,
                  NTAG215 of NTAG216 kaart bij de achterkant van je telefoon.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={startScan} disabled={!support.supported}>
                    <ScanLine className="h-4 w-4" /> Start NFC-scan
                  </Button>
                </div>
              </>
            ) : null}

            {state.kind === "scanning" ? (
              <>
                <h2 className="text-lg font-semibold">Scannen…</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Houd de kaart stil bij het apparaat. Annuleer de prompt om
                  opnieuw te beginnen.
                </p>
              </>
            ) : null}

            {state.kind === "error" ? (
              <>
                <h2 className="text-lg font-semibold text-red-700">
                  Scannen mislukt
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  {state.message}
                </p>
                <Button variant="outline" onClick={reset}>
                  Opnieuw
                </Button>
              </>
            ) : null}

            {state.kind === "done" ? (
              <>
                <h2 className="text-lg font-semibold">
                  UID:{" "}
                  <span className="font-mono">{shortUid(state.uid)}</span>
                </h2>
                {state.match ? (
                  <ScanMatch
                    card={state.match}
                    onRun={async () => {
                      const result = await runAction(state.match!);
                      push({
                        title: result.title,
                        description: result.description,
                        variant: result.ok ? "success" : "error",
                      });
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Deze UID is nog niet geregistreerd.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        onClick={() =>
                          router.push(
                            `/cards/new?uid=${encodeURIComponent(state.uid)}`,
                          )
                        }
                      >
                        <Plus className="h-4 w-4" /> Registreer deze kaart
                      </Button>
                      <Button variant="outline" onClick={reset}>
                        Opnieuw scannen
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">Handmatige UID</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Gebruik dit als Web NFC niet beschikbaar is, of als je een
                desktop-reader gebruikt.
              </p>
            </div>
            <Input
              value={manualUid}
              onChange={(e) => setManualUid(e.target.value)}
              placeholder="04:A2:1B:C9:7E:80"
              className="font-mono"
            />
            <Button
              className="w-full"
              onClick={() => handleUid(manualUid)}
              disabled={!manualUid.trim()}
            >
              <PlayCircle className="h-4 w-4" /> Verwerken
            </Button>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Smartphone className="h-3.5 w-3.5" /> Tip
              </p>
              <p className="mt-1">
                Op desktop kun je de UID overtypen die je leest met een
                NFC-reader-app. Zelf hosten? Voeg dan een eigen API toe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ScanMatch({
  card,
  onRun,
}: {
  card: NfcCard;
  onRun: () => void | Promise<void>;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{card.name}</p>
            <p className="text-xs text-muted-foreground">
              {card.scanCount} scans · laatst {formatDate(card.lastScannedAt)}
            </p>
          </div>
        </div>
        <Badge variant="success">Match</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRun} className="flex-1">
          <PlayCircle className="h-4 w-4" /> Voer actie uit
        </Button>
        <Link
          href={`/cards/detail?id=${card.id}`}
          className={buttonVariants({ variant: "outline" }) + " flex-1"}
        >
          Open kaart
        </Link>
      </div>
    </div>
  );
}
