import { apiClient, GATEWAY, unwrapList, unwrapOrThrow, uploadFile } from '@/shared/api';

/** `ChatParty`: the buyer of the order or the owner of its vendor. */
export type ChatParty = 'BUYER' | 'VENDOR';

/** Wire shape of `com.moonkage.order.dto.response.ChatMessageResponse`. */
export interface ChatMessage {
  id: string;
  /** Order of the thread; also the cursor for older pages and read markers. */
  seq: number;
  conversationId: string;
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
  conversationId: string;
  myParty: ChatParty;
  messages: ChatMessage[];
  buyerReadSeq: number;
  vendorReadSeq: number;
  hasMore: boolean;
}

/** Wire shape of `ConversationResponse`: one line of an inbox. */
export interface Conversation {
  id: string;
  vendorId: string;
  vendorName: string | null;
  buyerAccountId: string;
  buyerName: string | null;
  myParty: ChatParty;
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

/** What orchestrator pushes on `/user/queue/chat`. */
export interface ChatPush {
  type: 'MESSAGE' | 'READ' | 'TYPING';
  conversationId: string;
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

const BASE = GATEWAY.ORDER.CHAT_CONVERSATIONS;

export const chatApi = {
  /** "Nhắn shop": the caller's conversation with the Shop, the same one every time. */
  async start(vendorId: string): Promise<Conversation> {
    return unwrapOrThrow<Conversation>(await apiClient.post<unknown>(BASE, { vendorId }));
  },

  /** As a buyer: the Shops one wrote to; as a Shop owner: the buyers who wrote. */
  async inbox(as: ChatParty): Promise<Conversation[]> {
    return unwrapList<Conversation>(await apiClient.get<unknown>(BASE, { params: { as } }));
  },

  async thread(conversationId: string, before?: number): Promise<ChatThread> {
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.CHAT_CONVERSATION(conversationId), {
      params: before ? { before } : undefined,
    });
    return unwrapOrThrow<ChatThread>(res);
  },

  /** A file is sent to the object storage first; only its tempKey rides on the message. */
  async send(conversationId: string, body: string, file: File | null): Promise<ChatMessage> {
    const tempKey = file ? await uploadFile('ORDER', file) : null;
    const res = await apiClient.post<unknown>(GATEWAY.ORDER.CHAT_MESSAGES(conversationId), {
      body: body.trim() || null,
      attachmentTempKey: tempKey,
      attachmentName: file?.name ?? null,
    });
    return unwrapOrThrow<ChatMessage>(res);
  },

  async markRead(conversationId: string, upToSeq: number): Promise<void> {
    await apiClient.post(GATEWAY.ORDER.CHAT_READ(conversationId), { upToSeq });
  },

  async typing(conversationId: string): Promise<void> {
    await apiClient.post(GATEWAY.ORDER.CHAT_TYPING(conversationId), {});
  },
};
