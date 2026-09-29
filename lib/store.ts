// A small typed wrapper around browser storage, shared by simulation progress
// and notes progress. A database adapter (Supabase, Firebase, Apps Script…) can
// implement Store<T> later without any UI changes.

export type KeyValueBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Store<T> {
  /** False when saving is impossible (private mode, blocked storage). The site still works. */
  available: boolean;
  load(key: string): T | null;
  save(key: string, value: T): void;
  clear(key: string): void;
}

export interface StoreOptions<T> {
  /** Prepended to every key, e.g. "physlab:v1:notes:". */
  prefix: string;
  /** Saved data that fails this check is discarded, so old or corrupt data never crashes the page. */
  validate: (value: unknown) => value is T;
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

export function createStore<T>(backend: KeyValueBackend | null, options: StoreOptions<T>): Store<T> {
  const available = backend !== null && probe(backend);
  const keyFor = (key: string) => `${options.prefix}${key}`;

  return {
    available,
    load(key) {
      if (!available || !backend) return null;
      try {
        const raw = backend.getItem(keyFor(key));
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return options.validate(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(key, value) {
      if (!available || !backend) return;
      try {
        backend.setItem(keyFor(key), JSON.stringify(value));
      } catch {
        // Quota exceeded or storage revoked mid-session: keep working in memory.
      }
    },
    clear(key) {
      if (!available || !backend) return;
      try {
        backend.removeItem(keyFor(key));
      } catch {
        // Ignore, same as save.
      }
    },
  };
}

/** The browser's localStorage, or null when it is blocked or missing (server render, private mode). */
export function browserBackend(): KeyValueBackend | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
