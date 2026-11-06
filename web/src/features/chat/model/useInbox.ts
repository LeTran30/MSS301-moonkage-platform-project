import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, useRealtime } from '@/shared/api';
import { chatApi, chatQueue, type ChatParty, type ChatPush } from '../api/chatApi';

/** Without the socket, the inbox is read again this often. */
const POLL_MS = 15_000;

/** The conversations of the caller on one side, newest activity first. */
export function useInbox(as: ChatParty) {
  const queryClient = useQueryClient();
  const { connected, subscribe } = useRealtime();
  const key = queryKeys.chat.inbox(as);

  const query = useQuery({
    queryKey: key,
    queryFn: () => chatApi.inbox(as),
    staleTime: 0,
    refetchInterval: connected ? false : POLL_MS,
  });

  // a new message anywhere moves a line up or adds one
  useEffect(
    () =>
      subscribe<ChatPush>(chatQueue, (push) => {
        if (push.type === 'MESSAGE') void queryClient.invalidateQueries({ queryKey: ['chat', 'inbox'] });
      }),
    [subscribe, queryClient],
  );

  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.error instanceof Error ? query.error.message : null,
    conversations: query.data ?? [],
    reload: () => void query.refetch(),
  } as const;
}
