"use client";

import {
  cardSchema,
  type NfcCard,
  type NewCardInput,
  type Settings,
  settingsSchema,
} from "./types";
import { generateId } from "./utils";

const CARDS_KEY = "nfc-manager:cards:v1";
const SETTINGS_KEY = "nfc-manager:settings:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Repository abstraction so we can swap the local backend for Supabase / SQLite later
 * without touching pages.
 */
export interface CardRepository {
  list(): Promise<NfcCard[]>;
  get(id: string): Promise<NfcCard | null>;
  findByUid(uid: string): Promise<NfcCard | null>;
  create(input: NewCardInput): Promise<NfcCard>;
  update(id: string, patch: Partial<NfcCard>): Promise<NfcCard>;
  remove(id: string): Promise<void>;
  recordScan(uid: string): Promise<NfcCard | null>;
}

class LocalStorageCardRepository implements CardRepository {
  private read(): NfcCard[] {
    const raw = readJson<unknown[]>(CARDS_KEY, []);
    const parsed: NfcCard[] = [];
    for (const item of raw) {
      const r = cardSchema.safeParse(item);
      if (r.success) parsed.push(r.data);
    }
    return parsed;
  }

  private write(cards: NfcCard[]) {
    writeJson(CARDS_KEY, cards);
  }

  async list() {
    return this.read().sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async get(id: string) {
    return this.read().find((c) => c.id === id) ?? null;
  }

  async findByUid(uid: string) {
    const target = uid.trim().toLowerCase();
    return (
      this.read().find((c) => c.uid.toLowerCase() === target) ?? null
    );
  }

  async create(input: NewCardInput) {
    const now = new Date().toISOString();
    const card: NfcCard = {
      id: generateId(),
      name: input.name.trim(),
      uid: input.uid.trim(),
      nfcType: input.nfcType,
      actionType: input.actionType,
      actionValue: input.actionValue ?? "",
      notes: input.notes ?? "",
      createdAt: now,
      updatedAt: now,
      lastScannedAt: null,
      scanCount: 0,
    };
    const cards = this.read();
    cards.push(card);
    this.write(cards);
    return card;
  }

  async update(id: string, patch: Partial<NfcCard>) {
    const cards = this.read();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Kaart niet gevonden");
    const next = {
      ...cards[idx],
      ...patch,
      id: cards[idx].id,
      createdAt: cards[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    cards[idx] = cardSchema.parse(next);
    this.write(cards);
    return cards[idx];
  }

  async remove(id: string) {
    const cards = this.read().filter((c) => c.id !== id);
    this.write(cards);
  }

  async recordScan(uid: string) {
    const card = await this.findByUid(uid);
    if (!card) return null;
    return this.update(card.id, {
      lastScannedAt: new Date().toISOString(),
      scanCount: card.scanCount + 1,
    });
  }
}

export const cardRepository: CardRepository = new LocalStorageCardRepository();

export const settingsRepository = {
  async get(): Promise<Settings> {
    const raw = readJson<unknown>(SETTINGS_KEY, {});
    const parsed = settingsSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return settingsSchema.parse({});
  },
  async set(value: Settings) {
    writeJson(SETTINGS_KEY, settingsSchema.parse(value));
  },
};

export function exportAll() {
  if (!isBrowser()) return "{}";
  return JSON.stringify(
    {
      cards: readJson(CARDS_KEY, []),
      settings: readJson(SETTINGS_KEY, {}),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function importAll(json: string) {
  const data = JSON.parse(json) as {
    cards?: unknown[];
    settings?: unknown;
  };
  if (Array.isArray(data.cards)) {
    const valid = data.cards
      .map((c) => cardSchema.safeParse(c))
      .filter((r) => r.success)
      .map((r) => (r as { success: true; data: NfcCard }).data);
    writeJson(CARDS_KEY, valid);
  }
  if (data.settings) {
    const r = settingsSchema.safeParse(data.settings);
    if (r.success) writeJson(SETTINGS_KEY, r.data);
  }
}

export function wipeAll() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CARDS_KEY);
  window.localStorage.removeItem(SETTINGS_KEY);
}
