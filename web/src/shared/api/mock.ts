import { demoStore } from './demo';

/**
 * Stand-in for endpoints the backend does not have yet: answers like a request would (async, a copy of the data),
 * so a feature's `api/` can switch to `apiClient` without its callers changing.
 */
const MOCK_LATENCY_MS = 150;

export function mockResponse<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), MOCK_LATENCY_MS);
  });
}

/**
 * Seed data a feature can change (orders placed, mockups approved…), kept in the demo store so a change survives a
 * reload like it would on a server. `reset` puts the seed back.
 */
export function seedStore<T>(key: string, seed: T) {
  const storageKey = `seed:${key}`;
  return {
    get(): T {
      return demoStore.get<T>(storageKey, structuredClone(seed));
    },
    update(change: (current: T) => T): T {
      const next = change(this.get());
      demoStore.set(storageKey, next);
      return next;
    },
    reset() {
      demoStore.set(storageKey, structuredClone(seed));
    },
  };
}
