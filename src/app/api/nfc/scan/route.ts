import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/nfc/scan
 *
 * Endpoint for a small desktop NFC reader helper (Node/Electron/Python with
 * libnfc or PC/SC) to forward UIDs to this app. The browser keeps card data
 * in localStorage, so this endpoint only validates and echoes the payload —
 * the actual lookup happens client-side once a connected client polls or via
 * a future websocket bridge.
 *
 * Body: { uid: string, source?: string, readerId?: string }
 */
const payloadSchema = z.object({
  uid: z
    .string()
    .min(4)
    .max(64)
    .regex(/^[A-Za-z0-9:\-]+$/u, "uid contains invalid characters"),
  source: z.string().max(80).optional(),
  readerId: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 422 },
    );
  }
  return NextResponse.json({
    ok: true,
    uid: parsed.data.uid.toUpperCase(),
    receivedAt: new Date().toISOString(),
    source: parsed.data.source ?? null,
    readerId: parsed.data.readerId ?? null,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    description:
      "POST { uid, source?, readerId? } to forward NFC UIDs from a desktop helper.",
  });
}
