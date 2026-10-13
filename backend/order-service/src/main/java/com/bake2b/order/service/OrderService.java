package com.bake2b.order.service;

import com.bake2b.order.repository.OrderRepository;
import com.bake2b.order.repository.OrderItemRepository;
import com.bake2b.order.repository.PaymentRepository;
import com.bake2b.order.repository.LedgerRepository;
import com.bake2b.order.repository.MockupVersionRepository;
import com.bake2b.order.repository.ProgressUpdateRepository;
import com.bake2b.order.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-09 - FR-11, FR-19 - FR-22, FR-24, FR-25, FR-33, FR-39, FR-40, FR-42, FR-44. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final LedgerRepository ledgerRepository;
    private final MockupVersionRepository mockupVersionRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final AuditLogRepository auditLogRepository;
}
