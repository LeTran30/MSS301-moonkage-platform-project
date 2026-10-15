package com.bake2b.order.service.impl;

import com.bake2b.order.repository.CommissionConfigRepository;
import com.bake2b.order.repository.AuditLogRepository;
import com.bake2b.order.service.CommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommissionServiceImpl implements CommissionService {

    private final CommissionConfigRepository commissionConfigRepository;
    private final AuditLogRepository auditLogRepository;
}
