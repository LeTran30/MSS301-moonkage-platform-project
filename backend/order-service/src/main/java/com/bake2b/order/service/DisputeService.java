package com.bake2b.order.service;

import com.bake2b.order.repository.DisputeRepository;
import com.bake2b.order.repository.DisputeEvidenceRepository;
import com.bake2b.order.repository.LedgerRepository;
import com.bake2b.order.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-12, FR-51. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final LedgerRepository ledgerRepository;
    private final AuditLogRepository auditLogRepository;
}
