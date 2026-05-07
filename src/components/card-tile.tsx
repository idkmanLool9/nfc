"use client";

import Link from "next/link";
import {
  CreditCard,
  Link2,
  FileText,
  Download,
  CheckCircle2,
  User,
  Webhook,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ACTION_LABELS, type ActionType, type NfcCard } from "@/lib/types";
import { formatDate, shortUid } from "@/lib/utils";

const ICONS: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  open_link: Link2,
  show_text: FileText,
  open_file: Download,
  check_in: CheckCircle2,
  open_profile: User,
  webhook: Webhook,
  custom: Sparkles,
};

export function CardTile({ card }: { card: NfcCard }) {
  const Icon = ICONS[card.actionType] ?? CreditCard;
  return (
    <Link
      href={`/cards/detail?id=${card.id}`}
      className="group block rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {card.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {ACTION_LABELS[card.actionType]}
            </p>
          </div>
        </div>
        <Badge variant="muted" className="shrink-0">
          {card.nfcType}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            UID
          </p>
          <p className="mt-0.5 font-mono text-foreground">
            {shortUid(card.uid)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Scans
          </p>
          <p className="mt-0.5 font-medium text-foreground">{card.scanCount}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Laatst gescand
          </p>
          <p className="mt-0.5 text-foreground">
            {formatDate(card.lastScannedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CardTileSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-bar w-3/5" />
          <div className="skeleton-bar w-2/5" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="skeleton-bar w-full" />
        <div className="skeleton-bar w-4/5" />
        <div className="skeleton-bar w-3/4" />
      </div>
    </div>
  );
}
