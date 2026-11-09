package com.moonkage.order.repository;

import com.moonkage.order.entity.Dispute;
import com.moonkage.order.enums.DisputeStatus;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DisputeRepository extends JpaRepository<Dispute, String> {

    boolean existsByOrderIdAndStatus(String orderId, DisputeStatus status);

    /** The latest dispute of an order: the open one, else the last resolved. */
    Optional<Dispute> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);

    /** The admin's queue of open disputes, the longest wait first; the order comes in the same query. */
    @EntityGraph(attributePaths = "order")
    Page<Dispute> findByStatusOrderByCreatedAtAsc(DisputeStatus status, Pageable pageable);

    /** The decided disputes, the latest decision first. */
    @EntityGraph(attributePaths = "order")
    Page<Dispute> findByStatusOrderByResolvedAtDesc(DisputeStatus status, Pageable pageable);

    /** The orders among {@code orderIds} that have an open dispute: one query for a page of orders. */
    @Query("""
            select d.order.id from Dispute d
            where d.order.id in :orderIds and d.status = com.moonkage.order.enums.DisputeStatus.OPEN""")
    Set<String> findOrderIdsWithOpenDispute(Collection<String> orderIds);
}
