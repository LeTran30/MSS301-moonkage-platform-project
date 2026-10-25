import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../shared/api/client';
import { RealtimeContext, type RealtimeContextValue } from '../../../shared/api/realtime/realtimeContext';
import { createNfcSession, getNfcSession, nfcQueue, type NfcPushMessage } from '../api/nfc';
import { useNfcSession } from './useNfcSession';

vi.mock('../api/nfc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/nfc')>()),
  createNfcSession: vi.fn(),
  getNfcSession: vi.fn(),
}));

const POLL_MS = 2000;
const POLL_CONNECTED_MS = 15000;
const OPTIONS = { pollIntervalMs: POLL_MS, pollIntervalConnectedMs: POLL_CONNECTED_MS };
const NOW = new Date('2026-10-19T10:00:00Z');
const SESSION = { sessionId: 'h7nzZfk0RG1-DwRlsKtT6b4v_PIxv00w', expiresAt: '2026-10-19T10:05:00Z' };

const create = vi.mocked(createNfcSession);
const poll = vi.mocked(getNfcSession);

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** A stand-in for the STOMP connection: the test pushes messages itself. */
function fakeRealtime(connected: boolean) {
  const listeners = new Map<string, Set<(body: unknown) => void>>();
  const value: RealtimeContextValue = {
    connected,
    subscribe: <T,>(destination: string, onMessage: (body: T) => void) => {
      const set = listeners.get(destination) ?? new Set();
      const listener = onMessage as (body: unknown) => void;
      set.add(listener);
      listeners.set(destination, set);
      return () => set.delete(listener);
    },
  };
  const push = (message: Partial<NfcPushMessage>) =>
    act(() => {
      const body: NfcPushMessage = {
        type: 'FAILED',
        sessionId: SESSION.sessionId,
        reasonCode: null,
        attemptsLeft: null,
        lockedUntil: null,
        occurredAt: NOW.toISOString(),
        ...message,
      };
      listeners.get(nfcQueue)?.forEach((listener) => listener(body));
    });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(RealtimeContext.Provider, { value }, children);
  return { wrapper, push, listenerCount: () => listeners.get(nfcQueue)?.size ?? 0 };
}

async function renderStarted(onVerified = vi.fn(), connected = false) {
  create.mockResolvedValue(SESSION);
  const socket = fakeRealtime(connected);
  const hook = renderHook(() => useNfcSession(onVerified, OPTIONS), { wrapper: socket.wrapper });
  await act(async () => {
    await hook.result.current.start();
  });
  return { ...hook, ...socket };
}

describe('useNfcSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    poll.mockResolvedValue({ ...SESSION, status: 'PENDING' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('starts pending with the seconds left until expiresAt', async () => {
    const { result } = await renderStarted();

    expect(result.current.phase).toEqual({ kind: 'pending', session: SESSION, secondsLeft: 300 });
  });

  it('stops polling and reports once when the app has sent the card', async () => {
    const onVerified = vi.fn();
    const { result } = await renderStarted(onVerified);

    await advance(POLL_MS);
    expect(result.current.phase.kind).toBe('pending');

    poll.mockResolvedValue({ ...SESSION, status: 'VERIFIED' });
    await advance(POLL_MS);
    expect(result.current.phase).toEqual({ kind: 'verified' });
    expect(onVerified).toHaveBeenCalledTimes(1);

    const calls = poll.mock.calls.length;
    await advance(POLL_MS * 3);
    expect(poll).toHaveBeenCalledTimes(calls);
  });

  it('keeps polling after a network blip', async () => {
    const { result } = await renderStarted();

    poll.mockRejectedValueOnce(new ApiError(0, null, 'offline'));
    await advance(POLL_MS);
    expect(result.current.phase.kind).toBe('pending');

    poll.mockResolvedValue({ ...SESSION, status: 'VERIFIED' });
    await advance(POLL_MS);
    expect(result.current.phase.kind).toBe('verified');
  });

  it('treats 410 from the server as a lost QR', async () => {
    const { result } = await renderStarted();

    poll.mockRejectedValue(new ApiError(410, 'NFC_003', 'expired'));
    await advance(POLL_MS);

    expect(result.current.phase).toEqual({ kind: 'expired', reason: 'lost' });
  });

  it('expires when the countdown reaches zero', async () => {
    const { result } = await renderStarted();

    await advance(299_000);
    expect(result.current.phase).toMatchObject({ kind: 'pending', secondsLeft: 1 });
    await advance(1000);
    expect(result.current.phase).toEqual({ kind: 'expired', reason: 'timeout' });
  });

  it('reports a refused start with the server error', async () => {
    const locked = new ApiError(429, 'NFC_002', 'Xác minh NFC đang tạm khóa');
    create.mockRejectedValue(locked);
    const { result } = renderHook(() => useNfcSession(vi.fn(), OPTIONS));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.phase).toEqual({ kind: 'error', error: locked });
  });

  it('stops every timer and listener on unmount', async () => {
    const { unmount, listenerCount } = await renderStarted();
    expect(listenerCount()).toBe(1);

    unmount();
    await advance(POLL_MS * 3);

    expect(poll).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(listenerCount()).toBe(0);
  });

  describe('with the WebSocket push', () => {
    it('reports VERIFIED from the push at once, and only once when the poll sees it too', async () => {
      const onVerified = vi.fn();
      const { result, push } = await renderStarted(onVerified, true);

      push({ type: 'VERIFIED' });
      expect(result.current.phase).toEqual({ kind: 'verified' });

      poll.mockResolvedValue({ ...SESSION, status: 'VERIFIED' });
      await advance(POLL_CONNECTED_MS);
      expect(onVerified).toHaveBeenCalledTimes(1);
    });

    it('shows a refused card and keeps the QR for another try', async () => {
      const { result, push } = await renderStarted(vi.fn(), true);

      push({ type: 'FAILED', reasonCode: 'CARD_EXPIRED', attemptsLeft: 3 });

      expect(result.current.phase).toMatchObject({
        kind: 'pending',
        lastRejection: { reasonCode: 'CARD_EXPIRED', attemptsLeft: 3 },
      });
    });

    it('moves to locked with the lockout end', async () => {
      const { result, push } = await renderStarted(vi.fn(), true);

      push({ type: 'LOCKED', reasonCode: 'BAD_FORMAT', attemptsLeft: 0, lockedUntil: '2026-10-19T10:15:00Z' });

      expect(result.current.phase).toEqual({ kind: 'locked', lockedUntil: '2026-10-19T10:15:00Z' });
    });

    it('ignores pushes about another QR of the same account', async () => {
      const { result, push } = await renderStarted(vi.fn(), true);

      push({ type: 'VERIFIED', sessionId: 'another-session-0000000000000000' });

      expect(result.current.phase.kind).toBe('pending');
    });

    it('polls slowly while connected', async () => {
      await renderStarted(vi.fn(), true);

      await advance(POLL_CONNECTED_MS - 1);
      expect(poll).not.toHaveBeenCalled();
      await advance(1);
      expect(poll).toHaveBeenCalledTimes(1);
    });
  });
});
