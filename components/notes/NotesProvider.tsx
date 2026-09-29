"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  browserNotesStore,
  emptyNotesProgress,
  recordAttempt,
  toggleChecklist,
  type NotesProgress,
  type NotesStore,
} from "@/lib/notes/progress";

const SAVE_DELAY = 300; // ms

interface NotesContextValue {
  progress: NotesProgress;
  attempt: (id: string, correct: boolean) => void;
  toggle: (id: string) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext);
  if (!value) throw new Error("Notes components must be used inside <NotesProvider>.");
  return value;
}

/**
 * Holds one topic's notes progress. Saved progress loads after the page has mounted
 * (never during the static build), and changes are saved shortly after they happen.
 */
export function NotesProvider({ topic, children }: { topic: string; children: React.ReactNode }) {
  const [progress, setProgress] = useState<NotesProgress>(emptyNotesProgress);
  const [available, setAvailable] = useState(true);
  const store = useRef<NotesStore | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const s = browserNotesStore();
    store.current = s;
    // Loading from browser storage has to wait until after hydration, so this is a deliberate effect-time update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(s.available);
    const saved = s.load(topic);
    if (saved) setProgress(saved);
    loaded.current = true;
  }, [topic]);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => store.current?.save(topic, progress), SAVE_DELAY);
    return () => clearTimeout(id);
  }, [topic, progress]);

  const attempt = useCallback((id: string, correct: boolean) => setProgress((p) => recordAttempt(p, id, correct)), []);
  const toggle = useCallback((id: string) => setProgress((p) => toggleChecklist(p, id)), []);
  const value = useMemo(() => ({ progress, attempt, toggle }), [progress, attempt, toggle]);

  return (
    <NotesContext.Provider value={value}>
      {!available && (
        <p role="status" className="no-print mb-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Your browser is blocking storage, so your self-check results won&apos;t be saved when you close this page.
        </p>
      )}
      {children}
    </NotesContext.Provider>
  );
}
