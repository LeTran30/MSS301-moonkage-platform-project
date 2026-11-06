package com.moonkage.order.repository;

import com.moonkage.order.entity.ChatMessage;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    /** Newest first; {@code beforeSeq} is exclusive, Long.MAX_VALUE for the latest page. */
    @Query("select m from ChatMessage m where m.orderId = :orderId and m.seq < :beforeSeq order by m.seq desc")
    List<ChatMessage> findPage(String orderId, long beforeSeq, Pageable page);

    @Query("select coalesce(max(m.seq), 0) from ChatMessage m where m.orderId = :orderId")
    long lastSeq(String orderId);
}
