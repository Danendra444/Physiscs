import { browserBackend, createStore, type KeyValueBackend, type Store } from "../store";
import type { CheckState } from "./answer";

export const NOTES_SCHEMA_VERSION = 1;

export interface NotesProgress {
  schemaVersion: number;
  /** Self-check results by question id. */
  checks: Record<string, CheckState>;
  /** "I can…" ticks by item id. */
  checklist: Record<string, boolean>;
}

export type NotesStore = Store<NotesProgress>;

export const emptyNotesProgress = (): NotesProgress => ({
  schemaVersion: NOTES_SCHEMA_VERSION,
  checks: {},
  checklist: {},
});

function isNotesProgress(value: unknown): value is NotesProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== NOTES_SCHEMA_VERSION) return false;
  if (typeof v.checks !== "object" || v.checks === null) return false;
  if (typeof v.checklist !== "object" || v.checklist === null) return false;
  const checksOk = Object.values(v.checks).every((c) => {
    const check = c as Partial<CheckState> | null;
    return typeof check?.correct === "boolean" && typeof check.attempts === "number";
  });
  const checklistOk = Object.values(v.checklist).every((t) => typeof t === "boolean");
  return checksOk && checklistOk;
}

export function createNotesStore(backend: KeyValueBackend | null): NotesStore {
  return createStore<NotesProgress>(backend, {
    prefix: `physlab:v${NOTES_SCHEMA_VERSION}:notes:`,
    validate: isNotesProgress,
  });
}

export const browserNotesStore = (): NotesStore => createNotesStore(browserBackend());

/** Record one marked attempt. A question that has been answered correctly stays correct. */
export function recordAttempt(progress: NotesProgress, id: string, correct: boolean): NotesProgress {
  const before = progress.checks[id];
  return {
    ...progress,
    checks: {
      ...progress.checks,
      [id]: { correct: (before?.correct ?? false) || correct, attempts: (before?.attempts ?? 0) + 1 },
    },
  };
}

export function toggleChecklist(progress: NotesProgress, id: string): NotesProgress {
  return { ...progress, checklist: { ...progress.checklist, [id]: !progress.checklist[id] } };
}

export interface NotesIndexEntry {
  checks: { id: string }[];
  checklist: { id: string }[];
}

export interface NotesSummary {
  checksDone: number;
  checksTotal: number;
  checklistDone: number;
  checklistTotal: number;
}

/** Progress against what the notes contain now. Saved ids that no longer exist are ignored. */
export function summarise(progress: NotesProgress | null, entry: NotesIndexEntry): NotesSummary {
  return {
    checksDone: entry.checks.filter((c) => progress?.checks[c.id]?.correct).length,
    checksTotal: entry.checks.length,
    checklistDone: entry.checklist.filter((c) => progress?.checklist[c.id]).length,
    checklistTotal: entry.checklist.length,
  };
}
