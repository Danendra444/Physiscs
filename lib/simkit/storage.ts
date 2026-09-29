import { browserBackend, createStore, type KeyValueBackend, type Store } from "../store";
import type { Row } from "./types";

export type { KeyValueBackend };

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
  /** Typed by the student for the hand-in page; stays in their browser. */
  studentName: string;
}

export type ProgressStore = Store<SimProgress>;

export function emptyProgress(): SimProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    stepIndex: 0,
    answers: {},
    rows: [],
    axes: null,
    explanation: "",
    freePlay: false,
    studentName: "",
  };
}

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
    typeof v.freePlay === "boolean" &&
    typeof v.studentName === "string"
  );
}

// Keys stay "physlab:v1:<slug>" so students' saved simulation progress survives refactors.
export function createLocalStore(backend: KeyValueBackend | null): ProgressStore {
  return createStore<SimProgress>(backend, { prefix: `physlab:v${SCHEMA_VERSION}:`, validate: isProgress });
}

/** The store used by the simulation pages: localStorage when the browser allows it. */
export function browserStore(): ProgressStore {
  return createLocalStore(browserBackend());
}
