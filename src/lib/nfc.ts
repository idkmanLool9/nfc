"use client";

export type NfcSupport =
  | { supported: true; reason?: undefined }
  | { supported: false; reason: string };

export function getNfcSupport(): NfcSupport {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Server context" };
  }
  if (!("NDEFReader" in window)) {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome|Chromium/i.test(ua) && !/Edg|OPR/i.test(ua);
    if (!isAndroid) {
      return {
        supported: false,
        reason:
          "Web NFC werkt alleen op Android met Chrome. Op desktop kun je de helper-API of handmatige UID-invoer gebruiken.",
      };
    }
    if (!isChrome) {
      return {
        supported: false,
        reason:
          "Web NFC werkt op Android alleen in Chrome. Open deze pagina in Chrome.",
      };
    }
    return {
      supported: false,
      reason:
        "Deze browser ondersteunt Web NFC niet. Schakel chrome://flags/#enable-experimental-web-platform-features in.",
    };
  }
  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Web NFC vereist HTTPS (of localhost).",
    };
  }
  return { supported: true };
}

export interface ScanResult {
  uid: string;
  records: { type: string; data: string }[];
  raw: unknown;
}

interface NDEFReadingEventLike {
  serialNumber: string;
  message: { records: Array<{ recordType: string; data?: BufferSource }> };
}

interface NDEFReaderLike {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(
    type: "reading",
    listener: (e: NDEFReadingEventLike) => void,
  ): void;
  addEventListener(type: "readingerror", listener: (e: Event) => void): void;
}

export async function scanOnce(signal?: AbortSignal): Promise<ScanResult> {
  const support = getNfcSupport();
  if (!support.supported) throw new Error(support.reason);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = (window as any).NDEFReader as new () => NDEFReaderLike;
  const reader = new Ctor();
  await reader.scan({ signal });

  return new Promise<ScanResult>((resolve, reject) => {
    const onError = () => reject(new Error("Lezen van NFC-tag mislukt."));
    reader.addEventListener("readingerror", onError);
    reader.addEventListener("reading", (event) => {
      const records: { type: string; data: string }[] = [];
      try {
        const decoder = new TextDecoder();
        for (const r of event.message.records) {
          if (r.data) {
            records.push({
              type: r.recordType,
              data: decoder.decode(r.data),
            });
          } else {
            records.push({ type: r.recordType, data: "" });
          }
        }
      } catch {
        // ignore decode errors, UID still useful
      }
      resolve({
        uid: event.serialNumber,
        records,
        raw: event,
      });
    });
  });
}

export function normalizeUid(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9:\-]/g, "")
    .toUpperCase();
}
