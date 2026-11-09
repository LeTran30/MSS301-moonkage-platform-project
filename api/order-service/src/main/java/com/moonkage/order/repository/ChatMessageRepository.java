package com.moonkage.order.repository;

import com.moonkage.order.entity.ChatMessage;
import com.moonkage.order.enums.ChatParty;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    /** Newest first; {@code beforeSeq} is exclusive, Long.MAX_VALUE for the latest page. */
    @Query("select m from ChatMessage m where m.conversationId = :conversationId and m.seq < :beforeSeq"
            + " order by m.seq desc")
    List<ChatMessage> findPage(String conversationId, long beforeSeq, Pageable page);

    @Query("select coalesce(max(m.seq), 0) from ChatMessage m where m.conversationId = :conversationId")
    long lastSeq(String conversationId);

    Optional<ChatMessage> findFirstByConversationIdOrderBySeqDesc(String conversationId);

    /** Messages the other side sent after the reader's marker. */
    @Query("select count(m) from ChatMessage m where m.conversationId = :conversationId"
            + " and m.senderParty <> :reader and m.seq > :afterSeq")
    long countUnread(String conversationId, ChatParty reader, long afterSeq);
}
