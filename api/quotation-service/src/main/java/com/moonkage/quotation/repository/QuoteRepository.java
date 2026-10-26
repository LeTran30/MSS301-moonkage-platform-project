package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.QuoteStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuoteRepository extends JpaRepository<Quote, String> {

    List<Quote> findByRequestIdOrderBySubmittedAtAsc(String requestId);

    List<Quote> findByRequestIdIn(Collection<String> requestIds);

    Optional<Quote> findByIdAndRequestId(String id, String requestId);

    Optional<Quote> findByRequestIdAndVendorIdAndStatus(String requestId, String vendorId, QuoteStatus status);

    boolean existsBySupersedesQuoteId(String supersedesQuoteId);

    /** AC-17.3. A quote waiting for its deposit is left alone: the acceptance expires first. */
    @Modifying
    @Query("""
            update Quote q set q.status = :expired
            where q.status = :submitted and q.validUntil <= :now
              and not exists (select a.id from QuoteAcceptance a where a.quoteId = q.id and a.status = :pending)""")
    int expireOverdue(
            @Param("now") Instant now,
            @Param("submitted") QuoteStatus submitted,
            @Param("expired") QuoteStatus expired,
            @Param("pending") AcceptanceStatus pending);
}
