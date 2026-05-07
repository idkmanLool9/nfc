"use client";

import * as React from "react";
import Link from "next/link";
import {
  Link2,
  FileText,
  Download,
  CheckCircle2,
  User,
  Webhook,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cardRepository } from "@/lib/storage";
import {
  ACTION_HINTS,
  ACTION_LABELS,
  ACTION_TYPES,
  type ActionType,
  type NfcCard,
} from "@/lib/types";

const ICONS: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  open_link: Link2,
  show_text: FileText,
  open_file: Download,
  check_in: CheckCircle2,
  open_profile: User,
  webhook: Webhook,
  custom: Sparkles,
};

const DESCRIPTIONS: Record<ActionType, string> = {
  open_link: "Opent een externe URL in een nieuw tabblad.",
  show_text: "Toont de ingestelde tekst als melding.",
  open_file: "Opent een bestand- of download-URL (PDF, afbeelding, etc.).",
  check_in: "Logt een check-in moment voor de gekoppelde locatie.",
  open_profile: "Opent een profielpagina of profile-URL.",
  webhook: "Stuurt een POST naar een endpoint met de scan-payload.",
  custom: "Vrije configuratie voor toekomstige integraties.",
};

export default function ActionsPage() {
  const [cards, setCards] = React.useState<NfcCard[] | null>(null);
  React.useEffect(() => {
    cardRepository.list().then(setCards);
  }, []);

  const grouped = React.useMemo(() => {
    const map: Record<ActionType, NfcCard[]> = {
      open_link: [],
      show_text: [],
      open_file: [],
      check_in: [],
      open_profile: [],
      webhook: [],
      custom: [],
    };
    for (const c of cards ?? []) map[c.actionType].push(c);
    return map;
  }, [cards]);

  return (
    <>
      <PageHeader
        title="Acties beheren"
        description="Bekijk welke acties beschikbaar zijn en welke kaarten ze gebruiken."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACTION_TYPES.map((type) => {
          const Icon = ICONS[type];
          const list = grouped[type];
          return (
            <Card key={type}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {ACTION_LABELS[type]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {DESCRIPTIONS[type]}
                      </p>
                    </div>
                  </div>
                  <Badge variant="muted">{list.length}</Badge>
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Voorbeeld waarde
                </p>
                <p className="mt-1 truncate font-mono text-xs text-foreground">
                  {ACTION_HINTS[type]}
                </p>

                {list.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {list.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        href={`/cards/${c.id}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-white p-2 text-sm hover:border-brand-200"
                      >
                        <span className="truncate">{c.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                    {list.length > 3 ? (
                      <p className="text-xs text-muted-foreground">
                        +{list.length - 3} meer
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Nog geen kaarten gebruiken deze actie.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
