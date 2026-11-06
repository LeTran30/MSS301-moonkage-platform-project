import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button, Card, Icon, toast } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { formatDateTime } from '@/shared/utils';
import { CHAT_FILE_MAX_BYTES, CHAT_FILE_TYPES, CHAT_MAX_LENGTH, type ChatMessage } from '../api/chatApi';
import { useOrderChat } from '../model/useOrderChat';
import styles from './OrderChatPanel.module.css';

interface OrderChatPanelProps {
  orderId: string;
  /** Who is on the other side, as the page calls them ("shop", "người mua"). */
  counterpartName: string;
}

/** The chat of an order between its buyer and the vendor owner. */
export function OrderChatPanel({ orderId, counterpartName }: OrderChatPanelProps) {
  const chat = useOrderChat(orderId);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastSeq = chat.messages[chat.messages.length - 1]?.seq ?? 0;

  // follow the newest message
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastSeq, chat.otherTyping]);

  const canWrite = chat.myParty !== null;
  const lastMine = [...chat.messages].reverse().find((m) => m.senderParty === chat.myParty);

  function pickFile(picked: File | undefined) {
    if (!picked) return;
    if (!CHAT_FILE_TYPES.includes(picked.type)) {
      toast.warning('Chỉ gửi được ảnh JPG, PNG hoặc tệp PDF.');
      return;
    }
    if (picked.size > CHAT_FILE_MAX_BYTES) {
      toast.warning('Tệp lớn hơn 20 MB.');
      return;
    }
    setFile(picked);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sending || (!draft.trim() && !file)) return;
    setSending(true);
    try {
      await chat.send(draft, file);
      setDraft('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <Card padding="lg" className={styles.panel}>
      <div className={styles.header}>
        <Icon name="message" size={18} />
        <h3 className={styles.title}>Nhắn tin với {counterpartName}</h3>
      </div>

      <div ref={listRef} className={styles.list} aria-live="polite" aria-label="Tin nhắn">
        {chat.status === 'loading' && <p className={styles.hint}>Đang tải tin nhắn…</p>}
        {chat.status === 'error' && (
          <div className={styles.hint}>
            <p>{chat.error ?? 'Không tải được tin nhắn.'}</p>
            <Button variant="outline" size="sm" onClick={chat.reload}>
              Thử lại
            </Button>
          </div>
        )}
        {chat.status === 'ready' && chat.hasMore && (
          <div className={styles.older}>
            <Button variant="ghost" size="sm" loading={chat.loadingOlder} onClick={() => void chat.loadOlder()}>
              Xem tin cũ hơn
            </Button>
          </div>
        )}
        {chat.status === 'ready' && chat.messages.length === 0 && (
          <p className={styles.hint}>Chưa có tin nhắn. Hãy gửi lời chào tới {counterpartName}.</p>
        )}
        {chat.messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={m.senderParty === chat.myParty}
            seen={m.id === lastMine?.id && chat.otherReadSeq >= m.seq}
          />
        ))}
        {chat.otherTyping && <p className={styles.typing}>{counterpartName} đang soạn tin…</p>}
      </div>

      {canWrite ? (
        <form className={styles.composer} onSubmit={(e) => void submit(e)}>
          {file && (
            <div className={styles.fileChip}>
              <Icon name={file.type.startsWith('image/') ? 'image' : 'file'} size={14} />
              <span className={styles.fileName}>{file.name}</span>
              <button
                type="button"
                className={styles.fileRemove}
                aria-label="Bỏ tệp đính kèm"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )}
          <div className={styles.row}>
            <input
              ref={fileRef}
              type="file"
              className={styles.fileInput}
              accept={CHAT_FILE_TYPES.join(',')}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="ghost"
              iconLeft="upload"
              aria-label="Đính kèm ảnh hoặc PDF"
              onClick={() => fileRef.current?.click()}
            />
            <textarea
              className={styles.input}
              rows={1}
              maxLength={CHAT_MAX_LENGTH}
              placeholder={`Nhắn cho ${counterpartName}… (Enter để gửi, Shift+Enter xuống dòng)`}
              aria-label="Nội dung tin nhắn"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value.trim()) chat.signalTyping();
              }}
              onKeyDown={onKeyDown}
            />
            <Button type="submit" variant="primary" loading={sending} disabled={!draft.trim() && !file}>
              Gửi
            </Button>
          </div>
        </form>
      ) : (
        <p className={styles.hint}>Quản trị viên chỉ xem cuộc trò chuyện, không gửi tin.</p>
      )}
    </Card>
  );
}

function MessageBubble({ message, mine, seen }: { message: ChatMessage; mine: boolean; seen: boolean }) {
  const isImage = message.attachmentContentType?.startsWith('image/') ?? false;
  return (
    <div className={cn(styles.message, mine ? styles.mine : styles.theirs)}>
      <div className={styles.bubble}>
        {message.attachmentUrl && isImage && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <img className={styles.image} src={message.attachmentUrl} alt={message.attachmentName ?? 'Ảnh đính kèm'} />
          </a>
        )}
        {message.attachmentUrl && !isImage && (
          <a className={styles.fileLink} href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="file" size={14} /> {message.attachmentName ?? 'Tệp đính kèm'}
          </a>
        )}
        {message.body && <p className={styles.body}>{message.body}</p>}
      </div>
      <span className={styles.meta}>
        {formatDateTime(message.createdAt)}
        {seen && ' · Đã xem'}
      </span>
    </div>
  );
}
