import { apiClient, GATEWAY, unwrapOrThrow, uploadFile } from '@/shared/api';

/** `ChatParty`: the buyer of the order or the owner of its vendor. */
export type ChatParty = 'BUYER' | 'VENDOR';

/** Wire shape of `com.moonkage.order.dto.response.ChatMessageResponse`. */
export interface ChatMessage {
  id: string;
  /** Order of the thread; also the cursor for older pages and read markers. */
  seq: number;
  orderId: string;
  senderAccountId: string;
  senderParty: ChatParty;
  body: string | null;
  attachmentName: string | null;
  attachmentContentType: string | null;
  /** Short-lived link; read the thread again once it expires. */
  attachmentUrl: string | null;
  createdAt: string;
}

/** Wire shape of `ChatThreadResponse`: one page, oldest first. */
export interface ChatThread {
  orderId: string;
  /** `null` for an admin, who reads but never writes. */
  myParty: ChatParty | null;
  messages: ChatMessage[];
  buyerReadSeq: number;
  vendorReadSeq: number;
  hasMore: boolean;
}

/** What orchestrator pushes on `/user/queue/chat`. */
export interface ChatPush {
  type: 'MESSAGE' | 'READ' | 'TYPING';
  orderId: string;
  senderAccountId: string;
  senderParty: ChatParty;
  message: ChatMessage | null;
  readUpToSeq: number | null;
  occurredAt: string;
}

export const chatQueue = '/user/queue/chat';

/** Files the order bucket accepts (order.file.allowed-content-types). */
export const CHAT_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const CHAT_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const CHAT_MAX_LENGTH = 2000;

export const chatApi = {
  async thread(orderId: string, before?: number): Promise<ChatThread> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.CHAT(orderId), {
      params: before ? { before } : undefined,
    });
    return unwrapOrThrow<ChatThread>(res);
  },

  /** A file is sent to the object storage first; only its tempKey rides on the message. */
  async send(orderId: string, body: string, file: File | null): Promise<ChatMessage> {
    const tempKey = file ? await uploadFile('ORDER', file) : null;
    const res = await apiClient.post<unknown>(GATEWAY.ORDER.CHAT_MESSAGES(orderId), {
      body: body.trim() || null,
      attachmentTempKey: tempKey,
      attachmentName: file?.name ?? null,
    });
    return unwrapOrThrow<ChatMessage>(res);
  },

  async markRead(orderId: string, upToSeq: number): Promise<void> {
    await apiClient.post(GATEWAY.ORDER.CHAT_READ(orderId), { upToSeq });
  },

  async typing(orderId: string): Promise<void> {
    await apiClient.post(GATEWAY.ORDER.CHAT_TYPING(orderId), {});
  },
};
