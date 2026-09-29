"use client";

import { useEffect, useState } from "react";
import notesIndex from "@/content/notes/index.json";
import { browserNotesStore, summarise, type NotesSummary } from "@/lib/notes/progress";
import type { NotesIndexFile } from "@/lib/notes/scan.mjs";

/** "Self-checks 3/8 · Checklist 5/9" for the topic hub, read from the student's browser. */
export function NotesProgressSummary({ topic }: { topic: string }) {
  const entry = (notesIndex as NotesIndexFile)[topic];
  const [summary, setSummary] = useState<NotesSummary | null>(null);

  useEffect(() => {
    if (!entry) return;
    // Progress lives in the browser, so it can only be read after the page has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(summarise(browserNotesStore().load(topic), entry));
  }, [topic, entry]);

  if (!entry) return null;
  const s = summary ?? summarise(null, entry);
  return (
    <p className="text-sm text-muted" data-testid="notes-progress">
      Self-checks {s.checksDone}/{s.checksTotal} · Checklist {s.checklistDone}/{s.checklistTotal}
    </p>
  );
}
