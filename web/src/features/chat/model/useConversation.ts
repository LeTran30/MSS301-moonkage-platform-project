import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, useRealtime } from '@/shared/api';
import { chatApi, chatQueue, type ChatMessage, type ChatParty, type ChatPush, type ChatThread } from '../api/chatApi';

/** Every inbox list (buyer and Shop side). */
const INBOX_KEY = ['chat', 'inbox'];
/** Without the socket, the thread is read again this often. */
const POLL_MS = 10_000;
/** "đang soạn tin…" disappears when no new signal comes within this time. */
const TYPING_SHOWN_MS = 4_000;
/** At most one typing signal per this interval while the person types. */
const TYPING_SIGNAL_MS = 3_000;

/** Messages of both lists, once each, in thread order. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.seq - b.seq);
}

function otherParty(party: ChatParty | null): ChatParty | null {
  if (!party) return null;
  return party === 'BUYER' ? 'VENDOR' : 'BUYER';
}

/**
 * One buyer–Shop conversation: the latest page from order-service, kept
 * current by the pushes on `/user/queue/chat` (polling when the socket is down).
 */
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const { connected, subscribe } = useRealtime();
  const key = useMemo(() => queryKeys.chat.thread(conversationId), [conversationId]);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSignal = useRef(0);
  const lastReadSent = useRef(0);

  const query = useQuery({
    queryKey: key,
    queryFn: () => chatApi.thread(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 0,
    refetchInterval: connected ? false : POLL_MS,
  });
  const thread = query.data;
  const myParty = thread?.myParty ?? null;

  const patchThread = useCallback(
    (update: (t: ChatThread) => ChatThread) => {
      queryClient.setQueryData<ChatThread>(key, (t) => (t ? update(t) : t));
    },
    [queryClient, key],
  );

  // a reconnect may have missed pushes: read the latest page again
  useEffect(() => {
    if (connected && conversationId) void queryClient.invalidateQueries({ queryKey: key });
  }, [connected, conversationId, queryClient, key]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribe<ChatPush>(chatQueue, (push) => {
      if (push.conversationId !== conversationId) return;
      if (push.type !== 'TYPING') void queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      if (push.type === 'MESSAGE' && push.message) {
        const message = push.message;
        patchThread((t) => ({
          ...t,
          messages: mergeMessages(t.messages, [message]),
        }));
        if (push.senderParty !== myParty) setOtherTyping(false);
      } else if (push.type === 'READ' && push.readUpToSeq != null) {
        const seq = push.readUpToSeq;
        patchThread((t) =>
          push.senderParty === 'BUYER'
            ? { ...t, buyerReadSeq: Math.max(t.buyerReadSeq, seq) }
            : { ...t, vendorReadSeq: Math.max(t.vendorReadSeq, seq) },
        );
      } else if (push.type === 'TYPING' && push.senderParty !== myParty) {
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), TYPING_SHOWN_MS);
      }
    });
  }, [conversationId, subscribe, patchThread, myParty, queryClient]);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );

  const messages = mergeMessages(older, thread?.messages ?? []);
  const myReadSeq = myParty === 'BUYER' ? thread?.buyerReadSeq : thread?.vendorReadSeq;
  const otherReadSeq = myParty === 'BUYER' ? thread?.vendorReadSeq : thread?.buyerReadSeq;
  const lastFromOther = [...messages].reverse().find((m) => m.senderParty === otherParty(myParty));

  // tell the other side once the page shows their newest message
  useEffect(() => {
    if (!myParty || !lastFromOther) return;
    const seq = lastFromOther.seq;
    if (seq <= (myReadSeq ?? 0) || seq <= lastReadSent.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    lastReadSent.current = seq;
    void chatApi.markRead(conversationId, seq).then(() => {
      void queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      patchThread((t) =>
        myParty === 'BUYER'
          ? { ...t, buyerReadSeq: Math.max(t.buyerReadSeq, seq) }
          : { ...t, vendorReadSeq: Math.max(t.vendorReadSeq, seq) },
      );
    });
  }, [conversationId, myParty, lastFromOther, myReadSeq, patchThread, queryClient]);

  const send = useCallback(
    async (body: string, file: File | null) => {
      const message = await chatApi.send(conversationId, body, file);
      patchThread((t) => ({
        ...t,
        messages: mergeMessages(t.messages, [message]),
      }));
      void queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      return message;
    },
    [conversationId, patchThread, queryClient],
  );

  const signalTyping = useCallback(() => {
    const now = Date.now();
    if (!myParty || now - lastTypingSignal.current < TYPING_SIGNAL_MS) return;
    lastTypingSignal.current = now;
    void chatApi.typing(conversationId).catch(() => undefined);
  }, [conversationId, myParty]);

  const hasMore = olderHasMore ?? thread?.hasMore ?? false;
  const loadOlder = useCallback(async () => {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await chatApi.thread(conversationId, first.seq);
      setOlder((current) => mergeMessages(current, page.messages));
      setOlderHasMore(page.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, messages, loadingOlder]);

  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.error instanceof Error ? query.error.message : null,
    reload: () => void query.refetch(),
    messages,
    myParty,
    otherReadSeq: otherReadSeq ?? 0,
    otherTyping,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    signalTyping,
  } as const;
}
