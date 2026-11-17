import { atomWithStorage } from "jotai/utils";

function parseCollapsedIds(text: string | null, fallback: string[]): string[] {
  try {
    const value: unknown = JSON.parse(text ?? "null");
    return Array.isArray(value) &&
      value.length <= 10_000 &&
      value.every((id) => typeof id === "string" && id.length > 0)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

export const collapsedThreadIdsAtom = atomWithStorage<string[]>(
  "bb.mobileRecents.collapsedThreads",
  [],
  {
    getItem(key, initialValue) {
      try {
        return parseCollapsedIds(localStorage.getItem(key), initialValue);
      } catch {
        return initialValue;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
    subscribe(key, callback, initialValue) {
      const listener = (event: StorageEvent) => {
        if (
          event.storageArea === localStorage &&
          (event.key === key || event.key === null)
        )
          callback(parseCollapsedIds(event.newValue, initialValue));
      };
      window.addEventListener("storage", listener);
      return () => window.removeEventListener("storage", listener);
    },
  },
  { getOnInit: true },
);
