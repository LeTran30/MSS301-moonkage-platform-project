package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.QuoteRequest;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, String> {

    /** Serializes everything that changes the quotes of one request: submit, accept, deposit result (BR-17). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from QuoteRequest r where r.id = :id")
    Optional<QuoteRequest> findByIdForUpdate(@Param("id") String id);

    List<QuoteRequest> findByBuyerAccountIdOrderByCreatedAtDesc(String buyerAccountId);

    @Query("""
            select r from QuoteRequest r
            where r.id in (select i.requestId from RequestInvitation i where i.vendorId = :vendorId)
            order by r.createdAt desc""")
    List<QuoteRequest> findInvitingVendor(@Param("vendorId") String vendorId);
}
