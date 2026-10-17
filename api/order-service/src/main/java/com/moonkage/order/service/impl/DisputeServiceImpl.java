package com.moonkage.order.service.impl;

import com.moonkage.order.repository.AuditLogRepository;
import com.moonkage.order.repository.DisputeEvidenceRepository;
import com.moonkage.order.repository.DisputeRepository;
import com.moonkage.order.repository.LedgerRepository;
import com.moonkage.order.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DisputeServiceImpl implements DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final LedgerRepository ledgerRepository;
    private final AuditLogRepository auditLogRepository;
}
