package com.moonkage.payment.service.impl;

import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final LedgerRepository ledgerRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void collect(String orderId, long amount, String paymentId) {
        Ledger ledger = ledgerRepository.findForUpdateByOrderId(orderId).orElseGet(() -> open(orderId));
        ledger.setTotalCollected(ledger.getTotalCollected() + amount);
        ledger.setHeld(ledger.getHeld() + amount);
        ledgerRepository.save(ledger);
        ledgerEntryRepository.save(LedgerEntry.of(orderId, LedgerEntryKind.COLLECT, amount, paymentId, null));
    }

    /** vendor_id is filled from the order's events (order_snapshots); the payment does not know it. */
    private static Ledger open(String orderId) {
        Ledger ledger = new Ledger();
        ledger.setOrderId(orderId);
        return ledger;
    }
}
