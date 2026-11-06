package com.moonkage.order.service;

import com.moonkage.order.dto.request.MarkChatReadRequest;
import com.moonkage.order.dto.request.SendChatMessageRequest;
import com.moonkage.order.dto.response.ChatMessageResponse;
import com.moonkage.order.dto.response.ChatThreadResponse;
import com.moonkage.order.security.CurrentUserInfo;

/**
 * The chat of one order between its buyer and the owner of its vendor. An admin may read it (disputes) but not
 * write; anyone else gets ORDER_NOT_FOUND.
 */
public interface ChatService {

    /** A page of the thread, oldest first, before {@code beforeSeq} (null: the latest page). */
    ChatThreadResponse thread(CurrentUserInfo caller, String orderId, Long beforeSeq, int size);

    ChatMessageResponse send(CurrentUserInfo caller, String orderId, SendChatMessageRequest request);

    /** Moves the caller's read marker forward; a marker never goes back. */
    void markRead(CurrentUserInfo caller, String orderId, MarkChatReadRequest request);

    /** Tells the other side the caller is typing; nothing is stored. */
    void typing(CurrentUserInfo caller, String orderId);
}
