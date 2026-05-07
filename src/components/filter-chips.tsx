"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Chip = {
  key: string;
  label: string;
  onClear?: () => void;
};

export function FilterChips({
  chips,
  className,
}: {
  chips: Chip[];
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((c) => (
        <span key={c.key} className="fms-chip">
          {c.label}
          {c.onClear ? (
            <button
              type="button"
              onClick={c.onClear}
              aria-label={`${c.label} wissen`}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}
