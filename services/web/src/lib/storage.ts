export type JsonStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  save: (value: T) => boolean;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1;

export function createJsonStore<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  empty: T
): JsonStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cachedValue = empty;

  // storage can throw when the browser blocks it, so it reads as empty.
  function readRaw(): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function discard() {
    try {
      window.localStorage.removeItem(key);
    } catch {
      cachedRaw = null;
    }
  }

  function parse(raw: string): T | null {
    try {
      const value: unknown = JSON.parse(raw);

      return isValid(value) ? value : null;
    } catch {
      return null;
    }
  }

  function getSnapshot(): T {
    const raw = readRaw();

    if (raw === cachedRaw) {
      return cachedValue;
    }

    const parsed = raw === null ? empty : parse(raw);

    // a value that fails validation is removed so it cannot linger.
    if (parsed === null) {
      discard();
      cachedRaw = null;
      cachedValue = empty;

      return empty;
    }

    cachedRaw = raw;
    cachedValue = parsed;

    return parsed;
  }

  function save(value: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }

    listeners.forEach((listener) => listener());

    return true;
  }

  function subscribe(onChange: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        onChange();
      }
    };

    listeners.add(onChange);
    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  }

  return { subscribe, getSnapshot, save };
}
