"use client";

import Link from "next/link";
import * as React from "react";
import { Plus, Search, CreditCard, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input, Select } from "@/components/ui/input";
import { CardTile, CardTileSkeleton } from "@/components/card-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips, type Chip } from "@/components/filter-chips";
import { cardRepository } from "@/lib/storage";
import {
  ACTION_LABELS,
  ACTION_TYPES,
  NFC_TYPES,
  type ActionType,
  type NfcCard,
  type NfcType,
} from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";

type StatusTab = "all" | "active" | "never";

export default function CardsPage() {
  const [cards, setCards] = React.useState<NfcCard[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [nfcType, setNfcType] = React.useState<"" | NfcType>("");
  const [actionType, setActionType] = React.useState<"" | ActionType>("");
  const [tab, setTab] = React.useState<StatusTab>("all");

  React.useEffect(() => {
    cardRepository.list().then(setCards);
  }, []);

  const filtered = React.useMemo(() => {
    if (!cards) return null;
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.uid.toLowerCase().includes(q))
        return false;
      if (nfcType && c.nfcType !== nfcType) return false;
      if (actionType && c.actionType !== actionType) return false;
      if (tab === "active" && c.scanCount === 0) return false;
      if (tab === "never" && c.scanCount > 0) return false;
      return true;
    });
  }, [cards, search, nfcType, actionType, tab]);

  const chips: Chip[] = [
    search
      ? {
          key: "search",
          label: `Zoeken: ${search}`,
          onClear: () => setSearch(""),
        }
      : null,
    nfcType
      ? { key: "type", label: `Type: ${nfcType}`, onClear: () => setNfcType("") }
      : null,
    actionType
      ? {
          key: "action",
          label: `Actie: ${ACTION_LABELS[actionType]}`,
          onClear: () => setActionType(""),
        }
      : null,
  ].filter(Boolean) as Chip[];

  const counts = React.useMemo(() => {
    const list = cards ?? [];
    return {
      all: list.length,
      active: list.filter((c) => c.scanCount > 0).length,
      never: list.filter((c) => c.scanCount === 0).length,
    };
  }, [cards]);

  return (
    <>
      <PageHeader
        title="NFC-kaarten"
        description="Alle geregistreerde NTAG-kaarten en hun gekoppelde acties."
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

      <div className="fms-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="fms-label">Zoek records</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Naam of UID…"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="fms-label">NFC type</label>
            <Select
              value={nfcType}
              onChange={(e) => setNfcType(e.target.value as NfcType | "")}
            >
              <option value="">Alle types</option>
              {NFC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="fms-label">Actie</label>
            <Select
              value={actionType}
              onChange={(e) =>
                setActionType(e.target.value as ActionType | "")
              }
            >
              <option value="">Alle acties</option>
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTION_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 border-t border-border pt-3">
            <FilterChips chips={chips} />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-1 border-b border-border">
        {(
          [
            ["all", "Alle"],
            ["active", "Actief"],
            ["never", "Nooit gescand"],
          ] as const
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "relative -mb-px inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " +
                  (active ? "bg-brand-600" : "bg-slate-300")
                }
              />
              {label}
              <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-600">
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <CardTileSkeleton key={i} />
            ))
          : filtered.map((c) => <CardTile key={c.id} card={c} />)}
      </div>

      {filtered !== null && filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title={
              cards && cards.length === 0
                ? "Nog geen kaarten gevonden"
                : "Geen resultaten"
            }
            description={
              cards && cards.length === 0
                ? "Maak een nieuwe registratie om te beginnen."
                : "Pas je filters aan of wis ze om alle kaarten te zien."
            }
            action={
              <Link href="/cards/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> Nieuwe kaart
              </Link>
            }
          />
        </div>
      ) : null}
    </>
  );
}
