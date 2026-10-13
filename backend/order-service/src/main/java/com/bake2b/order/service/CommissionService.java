package com.bake2b.order.service;

import com.bake2b.order.repository.CommissionConfigRepository;
import com.bake2b.order.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-50. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class CommissionService {

    private final CommissionConfigRepository commissionConfigRepository;
    private final AuditLogRepository auditLogRepository;
}
