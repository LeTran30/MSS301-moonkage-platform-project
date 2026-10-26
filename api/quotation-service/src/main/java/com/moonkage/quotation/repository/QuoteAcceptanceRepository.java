package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.QuoteAcceptance;
import com.moonkage.quotation.enums.AcceptanceStatus;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuoteAcceptanceRepository extends JpaRepository<QuoteAcceptance, String> {

    /** Lets the caller lock the request before it loads the acceptance itself. */
    @Query("select a.requestId from QuoteAcceptance a where a.id = :id")
    Optional<String> findRequestIdById(@Param("id") String id);

    Optional<QuoteAcceptance> findFirstByQuoteIdOrderByAcceptedAtDesc(String quoteId);

    boolean existsByQuoteIdAndStatus(String quoteId, AcceptanceStatus status);

    boolean existsByRequestIdAndStatus(String requestId, AcceptanceStatus status);

    /** The buyer did not pay in time: the quote unlocks (L-10 step 4). */
    @Modifying
    @Query("""
            update QuoteAcceptance a set a.status = :expired, a.updatedAt = :now
            where a.status = :pending and a.paymentExpiresAt <= :now""")
    int expireOverdue(
            @Param("now") Instant now,
            @Param("pending") AcceptanceStatus pending,
            @Param("expired") AcceptanceStatus expired);
}
