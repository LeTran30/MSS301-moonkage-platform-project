package com.bake2b.order.service.impl;

import com.bake2b.order.repository.AuditLogRepository;
import com.bake2b.order.repository.DisputeEvidenceRepository;
import com.bake2b.order.repository.DisputeRepository;
import com.bake2b.order.repository.LedgerRepository;
import com.bake2b.order.service.DisputeService;
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
