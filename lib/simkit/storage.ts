import type { Row } from "./types";

// Progress is saved through this small interface. v1 uses the browser's
// localStorage; a database adapter (Supabase, Firebase, Apps Script…) can
// implement ProgressStore later without any simulation or UI changes.

export const SCHEMA_VERSION = 1;

export interface SimProgress {
  schemaVersion: number;
  /** Index of the activity step the student is on. */
  stepIndex: number;
  /** Chosen option index per multiple-choice step id. */
  answers: Record<string, number>;
  rows: Row[];
  axes: { x: string; y: string } | null;
  explanation: string;
  freePlay: boolean;
}

export interface ProgressStore {
  /** False when saving is impossible (private mode, blocked storage). The site still works. */
  available: boolean;
  load(slug: string): SimProgress | null;
  save(slug: string, progress: SimProgress): void;
  clear(slug: string): void;
}

export type KeyValueBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function emptyProgress(): SimProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    stepIndex: 0,
    answers: {},
    rows: [],
    axes: null,
    explanation: "",
    freePlay: false,
  };
}

const keyFor = (slug: string) => `physlab:v${SCHEMA_VERSION}:${slug}`;

function isProgress(value: unknown): value is SimProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === SCHEMA_VERSION &&
    typeof v.stepIndex === "number" &&
    typeof v.answers === "object" &&
    v.answers !== null &&
    Array.isArray(v.rows) &&
    (v.axes === null || typeof v.axes === "object") &&
    typeof v.explanation === "string" &&
    typeof v.freePlay === "boolean"
  );
}

function probe(backend: KeyValueBackend): boolean {
  try {
    const key = "physlab:probe";
    backend.setItem(key, "1");
    backend.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createLocalStore(backend: KeyValueBackend | null): ProgressStore {
  const available = backend !== null && probe(backend);

  return {
    available,
    load(slug) {
      if (!available || !backend) return null;
      try {
        const raw = backend.getItem(keyFor(slug));
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return isProgress(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(slug, progress) {
      if (!available || !backend) return;
      try {
        backend.setItem(keyFor(slug), JSON.stringify(progress));
      } catch {
        // Quota exceeded or storage revoked mid-session: keep working in memory.
      }
    },
    clear(slug) {
      if (!available || !backend) return;
      try {
        backend.removeItem(keyFor(slug));
      } catch {
        // Ignore, same as save.
      }
    },
  };
}

/** The store used by the site: localStorage when the browser allows it. */
export function browserStore(): ProgressStore {
  if (typeof window === "undefined") return createLocalStore(null);
  try {
    return createLocalStore(window.localStorage);
  } catch {
    return createLocalStore(null);
  }
}
