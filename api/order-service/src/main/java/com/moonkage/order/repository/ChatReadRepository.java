package com.moonkage.order.repository;

import com.moonkage.order.entity.ChatRead;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatReadRepository extends JpaRepository<ChatRead, ChatRead.Key> {

    List<ChatRead> findByConversationId(String conversationId);

    /** One statement, so two tabs reading at once cannot collide; the marker only moves forward. */
    @Modifying
    @Query(
            value = "INSERT INTO chat_reads (conversation_id, party, last_read_seq, updated_at) "
                    + "VALUES (:conversationId, :party, :seq, now()) "
                    + "ON CONFLICT (conversation_id, party) DO UPDATE "
                    + "SET last_read_seq = EXCLUDED.last_read_seq, updated_at = now() "
                    + "WHERE chat_reads.last_read_seq < EXCLUDED.last_read_seq",
            nativeQuery = true)
    int advance(String conversationId, String party, long seq);
}
