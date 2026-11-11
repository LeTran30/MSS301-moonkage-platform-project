package com.moonkage.payment.service.impl;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.dto.response.WalletResponse;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.Wallet;
import com.moonkage.payment.entity.WalletEntry;
import com.moonkage.payment.enums.WalletEntryKind;
import com.moonkage.payment.enums.WalletEntryReason;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.WalletEntryRepository;
import com.moonkage.payment.repository.WalletRepository;
import com.moonkage.payment.service.LedgerService;
import com.moonkage.payment.service.WalletNotifier;
import com.moonkage.payment.service.WalletService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int ORDER_CODE_LENGTH = 8;

    private final WalletRepository walletRepository;
    private final WalletEntryRepository entryRepository;
    private final LedgerRepository ledgerRepository;
    private final LedgerService ledgerService;
    private final WalletNotifier notifier;

    @Override
    @Transactional(readOnly = true)
    public WalletResponse mine(String accountId, int page, int size) {
        long balance =
                walletRepository.findById(accountId).map(Wallet::getBalance).orElse(0L);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return new WalletResponse(
                balance,
                PageResponse.from(entryRepository
                        .findByAccountIdOrderByCreatedAtDesc(accountId, pageable)
                        .map(e -> new WalletResponse.Entry(
                                e.getId(),
                                e.getKind(),
                                e.getReason(),
                                e.getAmount(),
                                e.getReferenceId(),
                                e.getCreatedAt()))));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void pay(String accountId, long amount, String paymentId) {
        debit(accountId, WalletEntryReason.PAYMENT, amount, paymentId);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void refundRejectedOrder(String orderId, String buyerAccountId) {
        if (entryRepository.existsByReasonAndReferenceId(WalletEntryReason.ORDER_REJECTED, orderId)) {
            return;
        }
        long held = ledgerRepository
                .findForUpdateByOrderId(orderId)
                .map(Ledger::getHeld)
                .orElse(0L);
        if (held <= 0) {
            log.warn("Order {} was rejected but the platform holds nothing of it; no wallet refund", orderId);
            return;
        }
        WalletEntry credit =
                save(buyerAccountId, WalletEntryKind.CREDIT, WalletEntryReason.ORDER_REJECTED, held, orderId);
        // the order's escrow goes down by the same amount, so the money is never counted twice (NFR-09)
        ledgerService.refund(orderId, held, credit.getId(), null);
        String code = orderCode(orderId);
        notifier.notify(
                buyerAccountId,
                "Đã hoàn " + WalletNotifier.money(held) + " vào ví",
                "Shop đã từ chối đơn #" + code + ". Toàn bộ tiền của đơn đã được hoàn vào ví Moonkage của bạn.",
                held);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void credit(String accountId, WalletEntryReason reason, long amount, String referenceId) {
        if (entryRepository.existsByReasonAndReferenceId(reason, referenceId)) {
            return;
        }
        save(accountId, WalletEntryKind.CREDIT, reason, amount, referenceId);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void debit(String accountId, WalletEntryReason reason, long amount, String referenceId) {
        Wallet wallet = walletRepository
                .findForUpdateByAccountId(accountId)
                .filter(w -> w.getBalance() >= amount)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_INSUFFICIENT));
        wallet.setBalance(wallet.getBalance() - amount);
        entryRepository.save(entry(accountId, WalletEntryKind.DEBIT, reason, amount, referenceId));
    }

    @Override
    @Transactional(readOnly = true)
    public long totalBalance() {
        return walletRepository.totalBalance();
    }

    /** A credit, opening the wallet on first use. */
    private WalletEntry save(
            String accountId, WalletEntryKind kind, WalletEntryReason reason, long amount, String referenceId) {
        Wallet wallet = walletRepository
                .findForUpdateByAccountId(accountId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().accountId(accountId).build()));
        wallet.setBalance(wallet.getBalance() + amount);
        return entryRepository.save(entry(accountId, kind, reason, amount, referenceId));
    }

    private static WalletEntry entry(
            String accountId, WalletEntryKind kind, WalletEntryReason reason, long amount, String referenceId) {
        return WalletEntry.builder()
                .accountId(accountId)
                .kind(kind)
                .reason(reason)
                .amount(amount)
                .referenceId(referenceId)
                .build();
    }

    /** The order as the web shows it (shortCode in web/src/shared/utils): last characters of the id, upper case. */
    static String orderCode(String orderId) {
        String compact = orderId.replace("-", "");
        return compact.substring(Math.max(0, compact.length() - ORDER_CODE_LENGTH))
                .toUpperCase(Locale.ROOT);
    }
}
