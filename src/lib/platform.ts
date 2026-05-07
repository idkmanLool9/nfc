"use client";

export type Platform = "web" | "capacitor-android" | "capacitor-ios";

export function getPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  // Capacitor exposes this global on native platforms.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.();
    if (p === "android") return "capacitor-android";
    if (p === "ios") return "capacitor-ios";
  }
  return "web";
}

export function isCapacitor() {
  const p = getPlatform();
  return p === "capacitor-android" || p === "capacitor-ios";
}
