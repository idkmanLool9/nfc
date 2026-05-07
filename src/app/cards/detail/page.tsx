"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Copy,
  Webhook,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CardForm } from "@/components/card-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cardRepository } from "@/lib/storage";
import { ACTION_LABELS, type NfcCard } from "@/lib/types";
import { formatDate, shortUid } from "@/lib/utils";
import { runAction } from "@/lib/actions";
import { isStandaloneAction } from "@/lib/nfc";
import { WriteToTagButton } from "@/components/write-to-tag";

function CardDetailInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const router = useRouter();
  const { push } = useToast();

  const [card, setCard] = React.useState<NfcCard | null | undefined>(undefined);

  React.useEffect(() => {
    if (!id) {
      setCard(null);
      return;
    }
    cardRepository.get(id).then(setCard);
  }, [id]);

  if (card === undefined) {
    return (
      <div className="space-y-3">
        <div className="skeleton-bar w-1/3" />
        <div className="skeleton-bar w-2/3" />
      </div>
    );
  }

  if (card === null) {
    return (
      <div className="fms-card p-8 text-center">
        <p className="text-base font-medium">Kaart niet gevonden</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Deze kaart bestaat niet (meer) op dit apparaat.
        </p>
        <Link
          href="/cards"
          className={buttonVariants({ variant: "outline" }) + " mt-4"}
        >
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Terug naar overzicht
        </Link>
      </div>
      <PageHeader
        title={card.name}
        description={`Geregistreerd op ${formatDate(card.createdAt)}`}
        actions={
          <>
            <WriteToTagButton card={card} />
            <Button
              variant="outline"
              onClick={async () => {
                const result = await runAction(card);
                push({
                  title: result.title,
                  description: result.description,
                  variant: result.ok ? "success" : "error",
                });
                if (result.ok) {
                  const updated = await cardRepository.update(card.id, {
                    lastScannedAt: new Date().toISOString(),
                    scanCount: card.scanCount + 1,
                  });
                  setCard(updated);
                }
              }}
            >
              <Play className="h-4 w-4" /> Test actie
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!window.confirm(`"${card.name}" verwijderen?`)) return;
                await cardRepository.remove(card.id);
                push({ title: "Kaart verwijderd", variant: "success" });
                router.push("/cards");
              }}
            >
              <Trash2 className="h-4 w-4" /> Verwijderen
            </Button>
          </>
        }
      />

      <div
        className={
          "mb-4 flex items-start gap-3 rounded-xl border p-4 text-sm " +
          (isStandaloneAction(card.actionType)
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900")
        }
      >
        <div className="mt-0.5 text-lg">
          {isStandaloneAction(card.actionType) ? "📱" : "ℹ️"}
        </div>
        <div className="min-w-0">
          {isStandaloneAction(card.actionType) ? (
            <>
              <p className="font-semibold">
                Werkt standalone op je telefoon
              </p>
              <p className="mt-0.5">
                Schrijf de actie naar de NFC-kaart met de knop{" "}
                <span className="font-semibold">&quot;Schrijf naar kaart&quot;</span>.
                Daarna opent je telefoon de actie automatisch zodra je de kaart
                tegen je toestel houdt — zonder dat de webapp open hoeft te
                staan.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">
                Webapp nodig om uit te voeren
              </p>
              <p className="mt-0.5">
                {ACTION_LABELS[card.actionType]} kan niet zelfstandig door een
                telefoon worden uitgevoerd. Open de webapp en scan de kaart om
                deze actie te triggeren.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              UID
            </p>
            <p className="mt-1 font-mono text-sm">{shortUid(card.uid)}</p>
            <button
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800"
              onClick={() => {
                navigator.clipboard.writeText(card.uid);
                push({ title: "UID gekopieerd", variant: "info" });
              }}
            >
              <Copy className="h-3 w-3" /> Kopiëren
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </p>
            <Badge className="mt-1.5">{card.nfcType}</Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              {ACTION_LABELS[card.actionType]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Activiteit
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{card.scanCount}</span> scans
            </p>
            <p className="text-xs text-muted-foreground">
              Laatst gescand: {formatDate(card.lastScannedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Bewerken</h2>
        <CardForm
          submitLabel="Wijzigingen opslaan"
          initial={{
            name: card.name,
            uid: card.uid,
            nfcType: card.nfcType,
            actionType: card.actionType,
            actionValue: card.actionValue,
            notes: card.notes,
          }}
          onSubmit={async (data) => {
            const updated = await cardRepository.update(card.id, data);
            setCard(updated);
            push({ title: "Wijzigingen opgeslagen", variant: "success" });
          }}
        />
      </div>

      {card.actionType === "webhook" && card.actionValue ? (
        <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Webhook className="h-3 w-3" /> Webhook target:{" "}
          <span className="font-mono">{card.actionValue}</span>
        </p>
      ) : card.actionType === "open_link" && card.actionValue ? (
        <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" /> Link target:{" "}
          <span className="font-mono">{card.actionValue}</span>
        </p>
      ) : null}
    </>
  );
}

export default function CardDetailPage() {
  return (
    <Suspense fallback={<div className="skeleton-bar w-1/3" />}>
      <CardDetailInner />
    </Suspense>
  );
}
