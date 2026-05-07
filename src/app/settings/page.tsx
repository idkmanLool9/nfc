"use client";

import * as React from "react";
import { Download, Upload, Trash2, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  exportAll,
  importAll,
  settingsRepository,
  wipeAll,
} from "@/lib/storage";
import { settingsSchema, type Settings } from "@/lib/types";
import { getNfcSupport } from "@/lib/nfc";

export default function SettingsPage() {
  const { push } = useToast();
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [helperUrl, setHelperUrl] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    settingsRepository.get().then((s) => {
      setSettings(s);
      setHelperUrl(s.helperUrl);
    });
  }, []);

  const support = React.useMemo(() => getNfcSupport(), []);

  if (!settings) {
    return <div className="skeleton-bar w-1/3" />;
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings!, [key]: value };
    setSettings(next);
    settingsRepository.set(next);
  }

  function saveHelperUrl() {
    const next = { ...settings!, helperUrl };
    const parsed = settingsSchema.safeParse(next);
    if (!parsed.success) {
      push({
        title: "Ongeldige URL",
        description: "Voer een geldige URL in of laat het veld leeg.",
        variant: "error",
      });
      return;
    }
    settingsRepository.set(parsed.data);
    setSettings(parsed.data);
    push({ title: "Opgeslagen", variant: "success" });
  }

  function downloadExport() {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nfc-cards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importAll(text);
      push({ title: "Import gelukt", variant: "success" });
      window.location.reload();
    } catch (err) {
      push({
        title: "Import mislukt",
        description: err instanceof Error ? err.message : String(err),
        variant: "error",
      });
    } finally {
      e.target.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Configuratie voor scanning, opslag en integraties."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold">Scangedrag</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Bepaal wat er gebeurt na een succesvolle scan.
              </p>
            </div>

            <Toggle
              label="Auto-uitvoeren na scan"
              description="Voer de gekoppelde actie automatisch uit zodra een bekende kaart wordt herkend."
              checked={settings.autoExecute}
              onChange={(v) => update("autoExecute", v)}
            />
            <Toggle
              label="Haptische feedback"
              description="Trillen bij een succesvolle scan (indien ondersteund)."
              checked={settings.hapticFeedback}
              onChange={(v) => update("hapticFeedback", v)}
            />

            <div>
              <label className="fms-label">Duplicaat-UID-beleid</label>
              <Select
                value={settings.duplicateUidPolicy}
                onChange={(e) =>
                  update(
                    "duplicateUidPolicy",
                    e.target.value as Settings["duplicateUidPolicy"],
                  )
                }
              >
                <option value="warn">Waarschuwen</option>
                <option value="block">Blokkeren</option>
                <option value="allow">Toestaan</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold">NFC ondersteuning</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Status van Web NFC in deze browser.
              </p>
            </div>

            <div
              className={
                "rounded-lg border p-3 text-sm " +
                (support.supported
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900")
              }
            >
              <p className="flex items-center gap-1.5 font-medium">
                <Smartphone className="h-4 w-4" />
                {support.supported
                  ? "Web NFC beschikbaar"
                  : "Web NFC niet beschikbaar"}
              </p>
              {!support.supported ? (
                <p className="mt-1">{support.reason}</p>
              ) : null}
            </div>

            <div>
              <label className="fms-label">
                Desktop helper-URL (optioneel)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={helperUrl}
                  onChange={(e) => setHelperUrl(e.target.value)}
                  placeholder="https://localhost:7654"
                />
                <Button variant="outline" onClick={saveHelperUrl}>
                  Opslaan
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Een kleine helper-app (bv. een Node/Electron of Python-tool met
                een PC/SC NFC-reader) kan UIDs naar deze webapp sturen via{" "}
                <span className="font-mono">/api/nfc/scan</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Data</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Kaarten worden lokaal opgeslagen in deze browser. Exporteer
                  een back-up of importeer eerder geëxporteerde data.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadExport}>
                <Download className="h-4 w-4" /> Exporteren
              </Button>
              <Button variant="outline" onClick={triggerImport}>
                <Upload className="h-4 w-4" /> Importeren
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={handleFile}
              />
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Alle lokale NFC-data wordt gewist. Doorgaan?",
                    )
                  )
                    return;
                  wipeAll();
                  push({ title: "Lokale data gewist", variant: "success" });
                  window.location.reload();
                }}
              >
                <Trash2 className="h-4 w-4" /> Alles wissen
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: vervang de localStorage-laag in{" "}
              <span className="font-mono">src/lib/storage.ts</span> om Supabase
              of Firebase te gebruiken — de pagina&apos;s gebruiken alleen de{" "}
              <span className="font-mono">CardRepository</span>-interface.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "mt-0.5 inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors " +
          (checked ? "bg-brand-600" : "bg-slate-300")
        }
      >
        <span
          className={
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
