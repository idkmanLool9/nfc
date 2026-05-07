"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: string; title: string; description?: string; variant: ToastVariant };

type Ctx = {
  push: (t: Omit<Toast, "id">) => void;
};

const ToastCtx = React.createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon =
            t.variant === "success"
              ? CheckCircle2
              : t.variant === "error"
                ? AlertTriangle
                : Info;
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg",
                t.variant === "success" && "border-emerald-200",
                t.variant === "error" && "border-red-200",
                t.variant === "info" && "border-brand-200",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 flex-shrink-0",
                  t.variant === "success" && "text-emerald-600",
                  t.variant === "error" && "text-red-600",
                  t.variant === "info" && "text-brand-600",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {t.title}
                </p>
                {t.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                ) : null}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-slate-100"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
