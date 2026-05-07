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
  XCircle,
  Bug,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  getNfcSupport,
  normalizeUid,
  startScan,
  type ScanController,
  type ScanRecord,
} from "@/lib/nfc";
import { cardRepository, settingsRepository } from "@/lib/storage";
import type { NfcCard } from "@/lib/types";
import { runAction } from "@/lib/actions";
import { formatDate, shortUid } from "@/lib/utils";

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "done"; uid: string; records: ScanRecord[]; match: NfcCard | null }
  | { kind: "error"; message: string };

type LogEntry = { ts: string; level: "info" | "warn" | "error"; msg: string };

export default function ScanPage() {
  const router = useRouter();
  const { push } = useToast();
  const [state, setState] = React.useState<ScanState>({ kind: "idle" });
  const [manualUid, setManualUid] = React.useState("");
  const [autoExecute, setAutoExecute] = React.useState(false);
  const [log, setLog] = React.useState<LogEntry[]>([]);
  const [showLog, setShowLog] = React.useState(false);
  const controllerRef = React.useRef<ScanController | null>(null);
  const support = React.useMemo(() => getNfcSupport(), []);

  React.useEffect(() => {
    settingsRepository.get().then((s) => setAutoExecute(s.autoExecute));
  }, []);

  React.useEffect(() => {
    return () => controllerRef.current?.cancel();
  }, []);

  function appendLog(level: LogEntry["level"], msg: string) {
    setLog((prev) =>
      [
        ...prev,
        { ts: new Date().toLocaleTimeString(), level, msg },
      ].slice(-30),
    );
  }

  async function handleUid(rawUid: string, records: ScanRecord[] = []) {
    const uid = normalizeUid(rawUid);
    if (!uid) {
      appendLog("warn", "Lege UID ontvangen");
      setState({
        kind: "error",
        message:
          "Lege UID ontvangen. Probeer opnieuw of gebruik handmatige invoer.",
      });
      return;
    }
    appendLog("info", `UID: ${uid}`);
    const match = await cardRepository.findByUid(uid);
    if (match) {
      const updated = await cardRepository.recordScan(uid);
      setState({
        kind: "done",
        uid,
        records,
        match: updated ?? match,
      });
      if (autoExecute && updated) {
        const result = await runAction(updated);
        push({
          title: result.title,
          description: result.description,
          variant: result.ok ? "success" : "error",
        });
      }
    } else {
      setState({ kind: "done", uid, records, match: null });
    }
  }

  async function startNfcScan() {
    if (!support.supported) return;
    setLog([]);
    appendLog("info", "Scan starten…");
    setState({ kind: "scanning" });
    const ctrl = startScan({
      onReadingError: () =>
        appendLog(
          "warn",
          "readingerror — tag onleesbaar of nog niet NDEF-geformatteerd; wacht op volgend signaal",
        ),
    });
    controllerRef.current = ctrl;
    try {
      const res = await ctrl.result;
      appendLog(
        "info",
        `reading event ontvangen (${res.records.length} records)`,
      );
      await handleUid(res.uid, res.records);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof Error && err.name === "AbortError") {
        appendLog("info", "Scan geannuleerd");
        setState({ kind: "idle" });
        return;
      }
      appendLog("error", msg);
      setState({ kind: "error", message: msg });
    } finally {
      controllerRef.current = null;
    }
  }

  function cancelScan() {
    controllerRef.current?.cancel();
  }

  function reset() {
    controllerRef.current?.cancel();
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
              Je kunt nog steeds handmatig een UID invoeren.
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
                ) : state.kind === "done" && !state.match ? (
                  <CreditCard className="h-9 w-9 text-amber-600" />
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
                  Geef toestemming als Chrome erom vraagt.
                </p>
                <Button onClick={startNfcScan} disabled={!support.supported}>
                  <ScanLine className="h-4 w-4" /> Start NFC-scan
                </Button>
              </>
            ) : null}

            {state.kind === "scanning" ? (
              <>
                <h2 className="text-lg font-semibold">Scannen…</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Houd de kaart stil tegen de bovenrand of achterkant van je
                  telefoon. Soms duurt het 1-2 seconden.
                </p>
                <Button variant="outline" onClick={cancelScan}>
                  <XCircle className="h-4 w-4" /> Annuleren
                </Button>
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
                <div className="flex gap-2">
                  <Button onClick={startNfcScan}>Opnieuw proberen</Button>
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                </div>
              </>
            ) : null}

            {state.kind === "done" ? (
              <>
                <h2 className="text-lg font-semibold">
                  UID:{" "}
                  <span className="font-mono">{shortUid(state.uid)}</span>
                </h2>
                {state.records.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {state.records.length} NDEF-record(s) gelezen
                  </p>
                ) : null}
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
                      <Button variant="outline" onClick={startNfcScan}>
                        Opnieuw scannen
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold">Handmatige UID</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gebruik dit als de scan niet werkt of op desktop.
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
                  Werkt scannen niet? Open Chrome op Android, geef NFC-permissie
                  als die wordt gevraagd, en houd de kaart bij de bovenkant van
                  het toestel (waar de NFC-antenne zit).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setShowLog((v) => !v)}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Bug className="h-4 w-4" /> Scan-log ({log.length})
                </span>
                <span className="text-xs text-muted-foreground">
                  {showLog ? "verbergen" : "tonen"}
                </span>
              </button>
              {showLog ? (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
                  {log.length === 0 ? (
                    <p className="text-slate-400">
                      Nog geen scans. Druk op &quot;Start NFC-scan&quot;.
                    </p>
                  ) : (
                    log.map((l, i) => (
                      <div key={i}>
                        <span className="text-slate-500">{l.ts}</span>{" "}
                        <span
                          className={
                            l.level === "error"
                              ? "text-red-400"
                              : l.level === "warn"
                                ? "text-amber-300"
                                : "text-emerald-300"
                          }
                        >
                          [{l.level}]
                        </span>{" "}
                        {l.msg}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
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
