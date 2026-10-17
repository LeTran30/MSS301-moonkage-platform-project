package com.moonkage.order.service.impl;

import com.moonkage.order.repository.AuditLogRepository;
import com.moonkage.order.repository.CommissionInvoiceRepository;
import com.moonkage.order.repository.DisbursementRequestRepository;
import com.moonkage.order.repository.LedgerRepository;
import com.moonkage.order.service.SettlementService;
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
