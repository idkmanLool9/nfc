"use client";

import Link from "next/link";
import * as React from "react";
import {
  CreditCard,
  ScanLine,
  Zap,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CardTile, CardTileSkeleton } from "@/components/card-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { cardRepository } from "@/lib/storage";
import type { NfcCard } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [cards, setCards] = React.useState<NfcCard[] | null>(null);

  React.useEffect(() => {
    cardRepository.list().then(setCards);
  }, []);

  const totalScans = (cards ?? []).reduce((sum, c) => sum + c.scanCount, 0);
  const recent = (cards ?? []).slice(0, 8);
  const mostActive =
    cards && cards.length > 0
      ? cards.reduce((a, b) => (a.scanCount >= b.scanCount ? a : b))
      : null;
  const lastScanned = (cards ?? [])
    .filter((c) => c.lastScannedAt)
    .sort(
      (a, b) =>
        new Date(b.lastScannedAt!).getTime() -
        new Date(a.lastScannedAt!).getTime(),
    )[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overzicht van je geregistreerde NFC-kaarten en activiteit."
        actions={
          <>
            <Link href="/scan" className={buttonVariants({ variant: "outline" })}>
              <ScanLine className="h-4 w-4" /> Scannen
            </Link>
            <Link href="/cards/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Nieuwe kaart
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Geregistreerde kaarten"
          value={cards?.length ?? "—"}
          icon={CreditCard}
        />
        <StatCard
          label="Totale scans"
          value={cards ? totalScans : "—"}
          icon={ScanLine}
        />
        <StatCard
          label="Unieke acties"
          value={cards ? new Set(cards.map((c) => c.actionType)).size : "—"}
          icon={Zap}
        />
        <StatCard
          label="Meest actief"
          value={mostActive ? mostActive.name : "—"}
          icon={TrendingUp}
          hint={
            lastScanned ? `Laatst gescand: ${lastScanned.name}` : "Nog geen scans"
          }
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recente kaarten</h2>
        <Link
          href="/cards"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Alles bekijken <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards === null
          ? Array.from({ length: 4 }).map((_, i) => <CardTileSkeleton key={i} />)
          : recent.length === 0
            ? null
            : recent.map((c) => <CardTile key={c.id} card={c} />)}
      </div>

      {cards !== null && cards.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="Nog geen NFC-kaarten geregistreerd"
            description="Scan een kaart of voer een UID handmatig in om te beginnen."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/cards/new" className={buttonVariants()}>
                  <Plus className="h-4 w-4" /> Nieuwe kaart
                </Link>
                <Link href="/scan" className={buttonVariants({ variant: "outline" })}>
                  <ScanLine className="h-4 w-4" /> NFC scannen
                </Link>
              </div>
            }
          />
        </div>
      ) : null}
    </>
  );
}
