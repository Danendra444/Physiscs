import { describe, expect, it } from "vitest";
import {
  createNotesStore,
  emptyNotesProgress,
  NOTES_SCHEMA_VERSION,
  recordAttempt,
  summarise,
  toggleChecklist,
} from "@/lib/notes/progress";
import type { KeyValueBackend } from "@/lib/store";

function memoryBackend(): KeyValueBackend & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe("recordAttempt", () => {
  it("counts attempts and remembers a correct answer", () => {
    let p = emptyNotesProgress();
    p = recordAttempt(p, "q1", false);
    expect(p.checks.q1).toEqual({ correct: false, attempts: 1 });
    p = recordAttempt(p, "q1", true);
    expect(p.checks.q1).toEqual({ correct: true, attempts: 2 });
  });

  it("keeps a correct result even if a later attempt is wrong", () => {
    let p = recordAttempt(emptyNotesProgress(), "q1", true);
    p = recordAttempt(p, "q1", false);
    expect(p.checks.q1.correct).toBe(true);
    expect(p.checks.q1.attempts).toBe(2);
  });

  it("does not change the object it was given", () => {
    const p = emptyNotesProgress();
    recordAttempt(p, "q1", true);
    expect(p.checks).toEqual({});
  });
});

describe("toggleChecklist", () => {
  it("ticks and unticks", () => {
    let p = toggleChecklist(emptyNotesProgress(), "c1");
    expect(p.checklist.c1).toBe(true);
    p = toggleChecklist(p, "c1");
    expect(p.checklist.c1).toBe(false);
  });
});

describe("summarise", () => {
  const entry = { checks: [{ id: "q1" }, { id: "q2" }, { id: "q3" }], checklist: [{ id: "c1" }, { id: "c2" }] };

  it("counts correct checks and ticked items against the totals", () => {
    let p = emptyNotesProgress();
    p = recordAttempt(p, "q1", true);
    p = recordAttempt(p, "q2", false);
    p = toggleChecklist(p, "c2");
    expect(summarise(p, entry)).toEqual({ checksDone: 1, checksTotal: 3, checklistDone: 1, checklistTotal: 2 });
  });

  it("ignores saved ids that no longer exist in the notes", () => {
    let p = recordAttempt(emptyNotesProgress(), "deleted-question", true);
    p = toggleChecklist(p, "deleted-item");
    expect(summarise(p, entry)).toEqual({ checksDone: 0, checksTotal: 3, checklistDone: 0, checklistTotal: 2 });
  });

  it("copes with no saved progress", () => {
    expect(summarise(null, entry)).toEqual({ checksDone: 0, checksTotal: 3, checklistDone: 0, checklistTotal: 2 });
  });
});

describe("createNotesStore", () => {
  it("saves under its own namespace so it never clashes with simulation progress", () => {
    const backend = memoryBackend();
    const store = createNotesStore(backend);
    store.save("oscillations", recordAttempt(emptyNotesProgress(), "q1", true));
    expect([...backend.data.keys()]).toEqual([`physlab:v${NOTES_SCHEMA_VERSION}:notes:oscillations`]);
    expect(store.load("oscillations")?.checks.q1.correct).toBe(true);
  });

  it("discards data with another schema version, corrupt JSON or the wrong shape", () => {
    const backend = memoryBackend();
    const key = `physlab:v${NOTES_SCHEMA_VERSION}:notes:t`;
    const store = createNotesStore(backend);
    backend.setItem(key, JSON.stringify({ ...emptyNotesProgress(), schemaVersion: 99 }));
    expect(store.load("t")).toBeNull();
    backend.setItem(key, "{oops");
    expect(store.load("t")).toBeNull();
    backend.setItem(key, JSON.stringify({ schemaVersion: NOTES_SCHEMA_VERSION, checks: "x", checklist: {} }));
    expect(store.load("t")).toBeNull();
    backend.setItem(key, JSON.stringify({ schemaVersion: NOTES_SCHEMA_VERSION, checks: { q: { correct: "yes", attempts: 1 } }, checklist: {} }));
    expect(store.load("t")).toBeNull();
  });

  it("keeps working when storage throws", () => {
    const store = createNotesStore({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(store.available).toBe(false);
    expect(() => store.save("t", emptyNotesProgress())).not.toThrow();
    expect(store.load("t")).toBeNull();
  });
});
