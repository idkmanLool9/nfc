"use client";

import type { NfcCard } from "./types";

export type ActionResult = {
  ok: boolean;
  title: string;
  description?: string;
};

export async function runAction(card: NfcCard): Promise<ActionResult> {
  const { actionType, actionValue, name } = card;
  if (!actionValue) {
    return {
      ok: false,
      title: "Geen waarde ingesteld",
      description: `Kaart "${name}" heeft geen actie-waarde.`,
    };
  }
  switch (actionType) {
    case "open_link":
    case "open_file":
    case "open_profile": {
      try {
        const url = new URL(actionValue, window.location.origin);
        if (!/^https?:$/.test(url.protocol)) {
          return {
            ok: false,
            title: "Onveilige URL",
            description: "Alleen http(s) URLs worden geopend.",
          };
        }
        window.open(url.toString(), "_blank", "noopener,noreferrer");
        return { ok: true, title: "Link geopend", description: url.toString() };
      } catch {
        return {
          ok: false,
          title: "Ongeldige URL",
          description: actionValue,
        };
      }
    }
    case "show_text":
      return { ok: true, title: name, description: actionValue };
    case "check_in":
      return {
        ok: true,
        title: "Check-in geregistreerd",
        description: actionValue,
      };
    case "webhook": {
      try {
        const url = new URL(actionValue);
        if (!/^https?:$/.test(url.protocol)) {
          return {
            ok: false,
            title: "Onveilige webhook",
            description: "Alleen http(s) endpoints zijn toegestaan.",
          };
        }
        const res = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: card.id,
            uid: card.uid,
            name: card.name,
            scannedAt: new Date().toISOString(),
          }),
        });
        return {
          ok: res.ok,
          title: res.ok ? "Webhook verstuurd" : "Webhook mislukt",
          description: `${res.status} ${res.statusText}`,
        };
      } catch (err) {
        return {
          ok: false,
          title: "Webhook mislukt",
          description: err instanceof Error ? err.message : String(err),
        };
      }
    }
    case "custom":
      return {
        ok: true,
        title: "Custom actie",
        description: actionValue,
      };
  }
}
