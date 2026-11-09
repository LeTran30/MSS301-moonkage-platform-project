package com.moonkage.order.service;

import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.request.StartConversationRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.dto.response.ConversationResponse;
import com.moonkage.order.enums.ChatParty;
import com.moonkage.order.security.CurrentUserInfo;
import java.util.List;

/**
 * One conversation per buyer and Shop, open before any order. Only its two sides see it: the buyer and the owner of
 * the Shop; anyone else gets CONVERSATION_NOT_FOUND.
 */
public interface ChatService {

    /** "Nhắn shop": the caller's conversation with the Shop, created on the first call. */
    ConversationResponse start(CurrentUserInfo caller, StartConversationRequest request);

    /** The caller's inbox as a buyer (the Shops they wrote to) or as a Shop owner (the buyers who wrote). */
    List<ConversationResponse> inbox(CurrentUserInfo caller, ChatParty as);

    /** A page of the conversation, oldest first, before {@code beforeSeq} (null: the latest page). */
    ChatThreadResponse thread(CurrentUserInfo caller, String conversationId, Long beforeSeq, int size);

    ChatMessageResponse send(CurrentUserInfo caller, String conversationId, SendChatMessageRequest request);

    /** Moves the caller's read marker forward; a marker never goes back. */
    void markRead(CurrentUserInfo caller, String conversationId, MarkChatReadRequest request);

    /** Tells the other side the caller is typing; nothing is stored. */
    void typing(CurrentUserInfo caller, String conversationId);
}
