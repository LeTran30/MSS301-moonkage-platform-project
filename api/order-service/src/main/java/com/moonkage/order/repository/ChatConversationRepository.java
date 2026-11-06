package com.moonkage.order.repository;

import com.moonkage.order.entity.ChatConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {

    Optional<ChatConversation> findByBuyerAccountIdAndVendorId(String buyerAccountId, String vendorId);

    /** Newest activity first; a conversation with no message yet sorts by when it started. */
    @Query("select c from ChatConversation c where c.buyerAccountId = :buyerAccountId"
            + " order by coalesce(c.lastMessageAt, c.createdAt) desc")
    List<ChatConversation> findForBuyer(String buyerAccountId);

    @Query("select c from ChatConversation c where c.vendorId = :vendorId and c.lastMessageAt is not null"
            + " order by c.lastMessageAt desc")
    List<ChatConversation> findForVendor(String vendorId);
}
