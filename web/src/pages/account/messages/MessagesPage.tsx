import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatInbox, chatApi } from '@/features/chat';
import { toast } from '@/shared/ui';
import styles from './MessagesPage.module.css';

/** The buyer's conversations with Shops. `?shop=<vendorId>` (from "Nhắn shop") opens or starts that one. */
export function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const shopId = params.get('shop');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    chatApi
      .start(shopId)
      .then((conversation) => {
        if (!cancelled) setOpenId(conversation.id);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không mở được cuộc trò chuyện.');
      })
      .finally(() => {
        if (!cancelled) setParams({}, { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [shopId, setParams]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Tin nhắn với cửa hàng</h2>
      {/* remounts once "Nhắn shop" has a conversation to open */}
      <ChatInbox key={openId ?? 'inbox'} as="BUYER" initialConversationId={openId} />
    </div>
  );
}
