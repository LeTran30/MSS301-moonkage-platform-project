package com.bake2b.order.service.impl;

import com.bake2b.order.repository.AuditLogRepository;
import com.bake2b.order.repository.CommissionInvoiceRepository;
import com.bake2b.order.repository.DisbursementRequestRepository;
import com.bake2b.order.repository.LedgerRepository;
import com.bake2b.order.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {

    private final LedgerRepository ledgerRepository;
    private final DisbursementRequestRepository disbursementRequestRepository;
    private final CommissionInvoiceRepository commissionInvoiceRepository;
    private final AuditLogRepository auditLogRepository;
}
