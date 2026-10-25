import { readJson, writeJson } from '../utils/storage';

/**
 * Small persistent store for demo mode (`config.demoMode`): what a backend would remember between reloads
 * (who is logged in, which account verified its CCCD…). Feature `api/` files read and write it; nothing else does.
 */
const STORAGE_KEY = 'moonkage.demo';

type DemoState = Record<string, unknown>;

export const demoStore = {
  get<T>(key: string, fallback: T): T {
    const state = readJson<DemoState>(STORAGE_KEY, {});
    return key in state ? (state[key] as T) : fallback;
  },
  set(key: string, value: unknown) {
    writeJson(STORAGE_KEY, { ...readJson<DemoState>(STORAGE_KEY, {}), [key]: value });
  },
};
