import { describe, expect, it } from "vitest";
import { createLocalStore, emptyProgress, SCHEMA_VERSION, type KeyValueBackend } from "@/lib/simkit/storage";

function memoryBackend(): KeyValueBackend & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe("createLocalStore", () => {
  it("round-trips progress", () => {
    const store = createLocalStore(memoryBackend());
    const progress = { ...emptyProgress(), stepIndex: 2, answers: { p1: 1 }, rows: [{ m: 1, T: 2 }] };
    store.save("mass-spring", progress);
    expect(store.load("mass-spring")).toEqual(progress);
    expect(store.available).toBe(true);
  });

  it("returns null when nothing is saved", () => {
    expect(createLocalStore(memoryBackend()).load("nope")).toBeNull();
  });

  it("namespaces keys by schema version and slug", () => {
    const backend = memoryBackend();
    createLocalStore(backend).save("orbits", emptyProgress());
    expect([...backend.data.keys()]).toEqual([`physlab:v${SCHEMA_VERSION}:orbits`]);
  });

  it("discards data with a different schema version", () => {
    const backend = memoryBackend();
    backend.setItem(`physlab:v${SCHEMA_VERSION}:orbits`, JSON.stringify({ ...emptyProgress(), schemaVersion: 999 }));
    expect(createLocalStore(backend).load("orbits")).toBeNull();
  });

  it("discards corrupt JSON", () => {
    const backend = memoryBackend();
    backend.setItem(`physlab:v${SCHEMA_VERSION}:orbits`, "{not json");
    expect(createLocalStore(backend).load("orbits")).toBeNull();
  });

  it("discards data with the wrong shape", () => {
    const backend = memoryBackend();
    backend.setItem(`physlab:v${SCHEMA_VERSION}:orbits`, JSON.stringify({ schemaVersion: SCHEMA_VERSION, rows: "x" }));
    expect(createLocalStore(backend).load("orbits")).toBeNull();
  });

  it("works without crashing when the backend throws", () => {
    const throwing: KeyValueBackend = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const store = createLocalStore(throwing);
    expect(store.available).toBe(false);
    expect(() => store.save("x", emptyProgress())).not.toThrow();
    expect(store.load("x")).toBeNull();
  });

  it("is unavailable when there is no backend", () => {
    const store = createLocalStore(null);
    expect(store.available).toBe(false);
    expect(store.load("x")).toBeNull();
  });

  it("clears saved progress", () => {
    const store = createLocalStore(memoryBackend());
    store.save("x", emptyProgress());
    store.clear("x");
    expect(store.load("x")).toBeNull();
  });
});
