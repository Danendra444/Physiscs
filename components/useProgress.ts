"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserStore, emptyProgress, type ProgressStore, type SimProgress } from "@/lib/simkit/storage";

const SAVE_DELAY = 300; // ms

/** Loads saved progress after mount (never during the static build) and saves changes shortly after they happen. */
export function useProgress(slug: string) {
  const [progress, setProgress] = useState<SimProgress>(emptyProgress);
  const [storeAvailable, setStoreAvailable] = useState(true);
  const store = useRef<ProgressStore | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const s = browserStore();
    store.current = s;
    // Loading from browser storage must happen after hydration, so this is a deliberate effect-time update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoreAvailable(s.available);
    const saved = s.load(slug);
    if (saved) setProgress(saved);
    loaded.current = true;
  }, [slug]);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => store.current?.save(slug, progress), SAVE_DELAY);
    return () => clearTimeout(id);
  }, [slug, progress]);

  const update = useCallback((fn: (p: SimProgress) => SimProgress) => setProgress(fn), []);

  const restart = useCallback(() => {
    store.current?.clear(slug);
    setProgress(emptyProgress());
  }, [slug]);

  return { progress, update, restart, storeAvailable };
}
