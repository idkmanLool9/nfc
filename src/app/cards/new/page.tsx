"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CardForm } from "@/components/card-form";
import { cardRepository, settingsRepository } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { buttonVariants } from "@/components/ui/button";

function NewCardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const prefilledUid = params.get("uid") ?? "";

  return (
    <CardForm
      submitLabel="Kaart registreren"
      initial={{ uid: prefilledUid }}
      onSubmit={async (data) => {
        const settings = await settingsRepository.get();
        const existing = await cardRepository.findByUid(data.uid);
        if (existing) {
          if (settings.duplicateUidPolicy === "block") {
            push({
              title: "UID bestaat al",
              description: `${existing.name} gebruikt deze UID. Aanpassen niet toegestaan.`,
              variant: "error",
            });
            return;
          }
          if (settings.duplicateUidPolicy === "warn") {
            const confirmed = window.confirm(
              `Er bestaat al een kaart "${existing.name}" met deze UID. Toch registreren?`,
            );
            if (!confirmed) return;
          }
        }
        const created = await cardRepository.create(data);
        push({
          title: "Kaart geregistreerd",
          description: `${created.name} is toegevoegd.`,
          variant: "success",
        });
        router.push(`/cards/detail?id=${created.id}`);
      }}
    />
  );
}

export default function NewCardPage() {
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
        title="Nieuwe NFC-kaart"
        description="Registreer een NTAG-kaart en koppel een actie."
        actions={
          <Link href="/scan" className={buttonVariants({ variant: "outline" })}>
            Eerst scannen
          </Link>
        }
      />
      <Suspense fallback={<div className="skeleton-bar w-1/3" />}>
        <NewCardInner />
      </Suspense>
    </>
  );
}
