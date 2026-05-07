import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "NFC Card Manager",
  description: "Registreer en beheer NTAG213/215/216 NFC-kaarten en koppel acties.",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <ToastProvider>
          <div className="min-h-screen bg-background">
            <TopNav />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
              {children}
            </main>
            <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 text-xs text-muted-foreground">
              NFC Card Manager · Lokaal opgeslagen op dit apparaat
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
