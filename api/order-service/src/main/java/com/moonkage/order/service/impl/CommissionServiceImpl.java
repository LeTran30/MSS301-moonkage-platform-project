package com.moonkage.order.service.impl;

import com.moonkage.order.repository.AuditLogRepository;
import com.moonkage.order.repository.CommissionConfigRepository;
import com.moonkage.order.service.CommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommissionServiceImpl implements CommissionService {

    private final CommissionConfigRepository commissionConfigRepository;
    private final AuditLogRepository auditLogRepository;
}
