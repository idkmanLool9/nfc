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
          "Web NFC werkt alleen op Android met Chrome. Op desktop kun je de UID handmatig invoeren.",
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

export interface ScanRecord {
  type: string;
  data: string;
}

export interface ScanResult {
  uid: string;
  records: ScanRecord[];
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

export interface ScanController {
  /** Resolves with the first successful read. */
  result: Promise<ScanResult>;
  /** Cancels the scan. Causes `result` to reject with AbortError. */
  cancel: () => void;
  /** Fired for every reading-error event (e.g. blank/unformatted tag). */
  onReadingError?: (event: Event) => void;
}

/**
 * Start an NFC scan. Listeners are attached BEFORE `scan()` is awaited so we
 * never miss the very first `reading` event. Reading errors no longer cause
 * the promise to reject — many blank NTAG tags fire `readingerror` first and
 * then a real `reading` event with a valid serialNumber.
 */
export function startScan(opts?: {
  onReadingError?: (event: Event) => void;
}): ScanController {
  const support = getNfcSupport();
  if (!support.supported) {
    return {
      result: Promise.reject(new Error(support.reason)),
      cancel: () => {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = (window as any).NDEFReader as new () => NDEFReaderLike;
  const reader = new Ctor();
  const ac = new AbortController();
  let settled = false;

  const result = new Promise<ScanResult>((resolve, reject) => {
    const cleanup = () => {
      settled = true;
    };

    reader.addEventListener("reading", (event) => {
      if (settled) return;
      const decoder = new TextDecoder();
      const records: ScanRecord[] = [];
      try {
        for (const r of event.message.records) {
          records.push({
            type: r.recordType,
            data: r.data ? decoder.decode(r.data) : "",
          });
        }
      } catch {
        // ignore decode errors, UID alone is still useful
      }
      cleanup();
      ac.abort();
      resolve({ uid: event.serialNumber ?? "", records });
    });

    reader.addEventListener("readingerror", (e) => {
      // Don't reject — a readingerror often precedes a successful reading
      // for blank/unformatted NTAG tags. Surface it via callback for UI.
      opts?.onReadingError?.(e);
    });

    ac.signal.addEventListener("abort", () => {
      if (settled) return;
      cleanup();
      reject(
        Object.assign(new Error("Scan geannuleerd"), { name: "AbortError" }),
      );
    });

    reader
      .scan({ signal: ac.signal })
      .catch((err: unknown) => {
        if (settled) return;
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });

  return {
    result,
    cancel: () => ac.abort(),
  };
}

/**
 * Convenience wrapper: scan once and resolve with the first read.
 */
export async function scanOnce(signal?: AbortSignal): Promise<ScanResult> {
  const ctrl = startScan();
  if (signal) {
    const onAbort = () => ctrl.cancel();
    if (signal.aborted) ctrl.cancel();
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  return ctrl.result;
}

export function normalizeUid(value: string | undefined | null) {
  if (!value) return "";
  return value
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9:\-]/g, "")
    .toUpperCase();
}
