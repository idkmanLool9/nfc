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

## Deploy naar GitHub Pages

1. Push naar GitHub.
2. Ga naar **Settings → Pages → Build and deployment** en kies **Source: GitHub Actions**.
3. De workflow in `.github/workflows/deploy.yml` bouwt een statische export
   en publiceert deze automatisch. De site komt op
   `https://<user>.github.io/<repo>/`.

De `basePath` wordt automatisch op de repo-naam gezet via de
`NEXT_PUBLIC_BASE_PATH` env-variabele die de workflow invult.

Web NFC werkt op GitHub Pages omdat het over HTTPS draait — open de
gepubliceerde URL op een Android-telefoon in Chrome om kaarten te scannen.

API routes (`/api/*`) en dynamische routes worden **niet** geëxporteerd omdat
GitHub Pages alleen statische bestanden serveert. Voor de helper-API kun je
zelf hosten op Vercel/Render/etc.

## Android-app via Capacitor

De webapp kan ook als native Android-app worden uitgerold zonder de UI-code
opnieuw te schrijven. Dit gebruikt [Capacitor](https://capacitorjs.com/) om de
statische export te wikkelen in een echte APK.

### Vereisten op je dev-machine

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (Android SDK,
  build tools, een emulator of fysiek toestel met USB-debugging)

### Eenmalig: Android-project aanmaken

```bash
npm install
npm run cap:build           # bouwt out/ met empty basePath voor Capacitor
npx cap add android         # genereert de android/ map
```

Open daarna `android/app/src/main/AndroidManifest.xml` en voeg deze regels
toe binnen het `<manifest>` element zodat NFC werkt:

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="true" />
```

Commit de `android/` map.

### Builden en testen

```bash
npm run cap:sync            # build + sync naar android/
npm run cap:open:android    # opent Android Studio
# of:
npm run cap:run:android     # build, sync, en run op gekoppeld toestel
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)** voor
een installeerbare APK. Of klik op de Run-knop voor direct testen op
een aangesloten Android-telefoon (USB-debugging aan).

### NFC in Capacitor

De Capacitor WebView (Chromium) ondersteunt Web NFC zolang de NFC-permissie
in `AndroidManifest.xml` staat. De bestaande NFC-code in `src/lib/nfc.ts`
werkt daardoor 1-op-1 in de native app — geen aparte plugin nodig voor
basic read/write. Als je later background-tagdetectie of HCE wil, voeg dan
`@capacitor-community/nfc` toe en gebruik de `getPlatform()` helper in
`src/lib/platform.ts` om te switchen.

### Distributie

- **Op je eigen toestel**: APK bouwen → naar je telefoon kopiëren → installeren
  (USB-debugging of "Onbekende bronnen" toestaan).
- **Play Store**: maak een AAB via **Build → Generate Signed Bundle**,
  upload via [Play Console](https://play.google.com/console) ($25 eenmalig).

## Toekomstige backend

De UI praat alleen met `cardRepository` (`src/lib/storage.ts`). Vervang de
`LocalStorageCardRepository` door een Supabase-/Firebase-/SQLite-implementatie
die dezelfde `CardRepository` interface implementeert.
