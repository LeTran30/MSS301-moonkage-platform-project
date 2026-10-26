package com.moonkage.payment.service.impl;

import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.service.LedgerService;
import java.time.LocalDate;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final LedgerRepository ledgerRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final OrderSnapshotRepository snapshotRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void collect(String orderId, long amount, String paymentId) {
        Ledger ledger = ledgerRepository.findForUpdateByOrderId(orderId).orElseGet(() -> open(orderId));
        ledger.setTotalCollected(ledger.getTotalCollected() + amount);
        ledger.setHeld(ledger.getHeld() + amount);
        ledgerRepository.save(ledger);
        ledgerEntryRepository.save(LedgerEntry.of(orderId, LedgerEntryKind.COLLECT, amount, paymentId, null));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean holds(String orderId, long amount) {
        return ledgerRepository
                .findByOrderId(orderId)
                .map(l -> l.getHeld() >= amount)
                .orElse(false);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void refund(String orderId, long amount, String refundId, String actorAccountId) {
        take(
                orderId,
                LedgerEntryKind.REFUND,
                amount,
                refundId,
                actorAccountId,
                l -> l.setRefunded(l.getRefunded() + amount));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void disburse(String orderId, long amount, String requestId, String actorAccountId) {
        take(
                orderId,
                LedgerEntryKind.DISBURSE,
                amount,
                requestId,
                actorAccountId,
                l -> l.setDisbursed(l.getDisbursed() + amount));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void payout(String orderId, long amount, String payoutId, String actorAccountId) {
        take(
                orderId,
                LedgerEntryKind.PAYOUT,
                amount,
                payoutId,
                actorAccountId,
                l -> l.setPaidOut(l.getPaidOut() + amount));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void describe(String orderId, String vendorId, LocalDate expectedPayoutDate) {
        ledgerRepository.findForUpdateByOrderId(orderId).ifPresent(ledger -> {
            ledger.setVendorId(vendorId);
            ledger.setExpectedPayoutDate(expectedPayoutDate);
        });
    }

    /** Money leaving the order's held part (NFR-09: never more than held). */
    private void take(
            String orderId,
            LedgerEntryKind kind,
            long amount,
            String referenceId,
            String actorAccountId,
            Consumer<Ledger> book) {
        Ledger ledger = ledgerRepository
                .findForUpdateByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.LEDGER_NOT_FOUND));
        if (amount <= 0 || ledger.getHeld() < amount) {
            throw new AppException(ErrorCode.LEDGER_INSUFFICIENT);
        }
        ledger.setHeld(ledger.getHeld() - amount);
        book.accept(ledger);
        ledgerRepository.save(ledger);
        ledgerEntryRepository.save(LedgerEntry.of(orderId, kind, amount, referenceId, actorAccountId));
    }

    /** The vendor comes from the order's events when they arrived first; otherwise they fill it in later. */
    private Ledger open(String orderId) {
        Ledger ledger = new Ledger();
        ledger.setOrderId(orderId);
        ledger.setVendorId(snapshotRepository
                .findById(orderId)
                .map(OrderSnapshot::getVendorId)
                .orElse(null));
        return ledger;
    }
}
