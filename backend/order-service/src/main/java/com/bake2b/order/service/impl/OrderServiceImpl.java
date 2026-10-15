package com.bake2b.order.service.impl;

import com.bake2b.order.repository.AuditLogRepository;
import com.bake2b.order.repository.LedgerRepository;
import com.bake2b.order.repository.MockupVersionRepository;
import com.bake2b.order.repository.OrderItemRepository;
import com.bake2b.order.repository.OrderRepository;
import com.bake2b.order.repository.PaymentRepository;
import com.bake2b.order.repository.ProgressUpdateRepository;
import com.bake2b.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final LedgerRepository ledgerRepository;
    private final MockupVersionRepository mockupVersionRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final AuditLogRepository auditLogRepository;
}
