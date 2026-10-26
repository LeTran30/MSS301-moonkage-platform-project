package com.moonkage.order.repository;

import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, String> {

    /** Row lock for every status change (P-02 locks the same row). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findForUpdateById(String id);

    /**
     * Every filter is optional (null = any). {@code missingInvoice} keeps only orders without the vendor's invoice
     * file (AC-44.3); {@code openDispute} only orders with an open dispute (FR-49).
     */
    @Query("""
            select o from Order o
            where (:buyerAccountId is null or o.buyerAccountId = :buyerAccountId)
              and (:vendorId is null or o.vendorId = :vendorId)
              and (:paymentGroupId is null or o.paymentGroupId = :paymentGroupId)
              and (:kind is null or o.kind = :kind)
              and (:status is null or o.status = :status)
              and (:missingInvoice = false or o.invoiceObjectKey is null)
              and (:openDispute = false or exists (
                    select d.id from Dispute d
                    where d.order = o and d.status = com.moonkage.order.enums.DisputeStatus.OPEN))
            order by o.createdAt desc, o.id
            """)
    Page<Order> search(
            String buyerAccountId,
            String vendorId,
            String paymentGroupId,
            OrderKind kind,
            OrderStatus status,
            boolean missingInvoice,
            boolean openDispute,
            Pageable page);
}
