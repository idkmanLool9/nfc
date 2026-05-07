# NFC Card Manager

Een moderne webapp om NFC-kaarten (NTAG213, NTAG215, NTAG216) te registreren,
beheren en te koppelen aan acties. Gebouwd met Next.js 14 (App Router),
TypeScript, Tailwind CSS en shadcn/ui-stijl componenten. UI geïnspireerd op de
FMS-screenshots: schoon wit, blauwe accenten, filter-chips en kaartraster.

## Features

- Dashboard met stats en recente kaarten
- Kaartoverzicht met zoek + filter (NFC-type, actie) en filter-chips
- Nieuwe NFC-kaart registreren met scan- of handmatige UID-invoer
- Web NFC scan-pagina met visuele feedback en duidelijke fallback
- Actie koppelen per kaart: link, tekst, bestand, check-in, profiel, webhook, custom
- Acties-pagina met overzicht per type
- Instellingen: scangedrag, duplicaat-beleid, helper-URL, export/import, wipe
- Repository-patroon (`CardRepository`) zodat localStorage later vervangen kan
  worden door Supabase, Firebase of SQLite zonder UI-wijzigingen
- API endpoint `/api/nfc/scan` voor desktop NFC-readers (PC/SC, libnfc, …)

## Pages

| Route          | Beschrijving                       |
| -------------- | ---------------------------------- |
| `/`            | Dashboard                          |
| `/cards`       | Alle NFC-kaarten + filters         |
| `/cards/new`   | Nieuwe kaart registreren           |
| `/cards/[id]`  | Detail + bewerken + actie testen   |
| `/scan`        | NFC scannen                        |
| `/actions`     | Acties beheren                     |
| `/settings`    | Instellingen, export/import, helper|

## Data model

```ts
type NfcCard = {
  id: string;
  name: string;
  uid: string;
  nfcType: "NTAG213" | "NTAG215" | "NTAG216" | "Unknown";
  actionType: "open_link" | "show_text" | "open_file" | "check_in"
            | "open_profile" | "webhook" | "custom";
  actionValue: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastScannedAt: string | null;
  scanCount: number;
};
```

## Web NFC

Web NFC (`NDEFReader`) werkt alleen op Android Chrome over HTTPS (of localhost).
Op andere platforms toont de UI een duidelijke fallback en kun je UIDs
handmatig invoeren of via de helper-API doorsturen vanaf een desktop-reader.

## Development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Toekomstige backend

De UI praat alleen met `cardRepository` (`src/lib/storage.ts`). Vervang de
`LocalStorageCardRepository` door een Supabase-/Firebase-/SQLite-implementatie
die dezelfde `CardRepository` interface implementeert.
