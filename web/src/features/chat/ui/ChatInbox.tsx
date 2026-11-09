import { useState } from 'react';
import { Button, Card, EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { formatRelative } from '@/shared/utils';
import type { ChatParty, Conversation } from '../api/chatApi';
import { useInbox } from '../model/useInbox';
import { ChatPanel } from './ChatPanel';
import styles from './ChatInbox.module.css';

interface ChatInboxProps {
  /** BUYER: the Shops the person wrote to; VENDOR: the buyers who wrote to their Shop. */
  as: ChatParty;
  /** Open this conversation first, e.g. the one "Nhắn shop" just started; read on mount only. */
  initialConversationId?: string | null;
}

function counterpartOf(c: Conversation): string {
  return (c.myParty === 'BUYER' ? c.vendorName : c.buyerName) ?? (c.myParty === 'BUYER' ? 'Cửa hàng' : 'Khách hàng');
}

function previewOf(c: Conversation): string {
  const m = c.lastMessage;
  if (!m) return 'Chưa có tin nhắn';
  const text = m.body ?? `📎 ${m.attachmentName ?? 'Tệp đính kèm'}`;
  return m.senderParty === c.myParty ? `Bạn: ${text}` : text;
}

/** The list of conversations on one side, with the chosen one open next to it. */
export function ChatInbox({ as, initialConversationId = null }: ChatInboxProps) {
  const inbox = useInbox(as);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);

  const selected = inbox.conversations.find((c) => c.id === selectedId) ?? null;

  if (inbox.status === 'error') {
    return (
      <Card padding="lg">
        <p>{inbox.error ?? 'Không tải được tin nhắn.'}</p>
        <Button variant="outline" size="sm" onClick={inbox.reload}>
          Thử lại
        </Button>
      </Card>
    );
  }

  if (inbox.status === 'ready' && inbox.conversations.length === 0 && !selectedId) {
    return (
      <EmptyState
        icon="message"
        title="Chưa có tin nhắn"
        description={
          as === 'BUYER'
            ? 'Bấm "Nhắn shop" ở trang sản phẩm hoặc trang cửa hàng để hỏi người bán.'
            : 'Khi khách hỏi cửa hàng của bạn, cuộc trò chuyện sẽ hiện ở đây.'
        }
      />
    );
  }

  return (
    <div className={styles.layout}>
      <Card padding="none" className={styles.list}>
        <ul className={styles.items} aria-label="Cuộc trò chuyện">
          {inbox.conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={cn(styles.item, c.id === selectedId && styles.active)}
                aria-current={c.id === selectedId || undefined}
                onClick={() => setSelectedId(c.id)}
              >
                <span className={styles.itemTop}>
                  <span className={styles.name}>{counterpartOf(c)}</span>
                  {c.lastMessageAt && <span className={styles.time}>{formatRelative(c.lastMessageAt)}</span>}
                </span>
                <span className={styles.itemBottom}>
                  <span className={cn(styles.preview, c.unreadCount > 0 && styles.unreadText)}>{previewOf(c)}</span>
                  {c.unreadCount > 0 && (
                    <span className={styles.badge} aria-label={`${c.unreadCount} tin chưa đọc`}>
                      {c.unreadCount}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <div className={styles.panel}>
        {selectedId ? (
          <ChatPanel
            key={selectedId}
            conversationId={selectedId}
            counterpartName={selected ? counterpartOf(selected) : 'Cuộc trò chuyện'}
          />
        ) : (
          <Card padding="lg" className={styles.placeholder}>
            Chọn một cuộc trò chuyện để xem tin nhắn.
          </Card>
        )}
      </div>
    </div>
  );
}
