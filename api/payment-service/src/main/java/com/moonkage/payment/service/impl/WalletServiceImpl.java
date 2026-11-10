package com.moonkage.payment.service.impl;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.client.IdentityClient;
import com.moonkage.payment.client.dto.AccountContact;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.EmailNotificationEvent;
import com.moonkage.payment.dto.event.InAppNotificationEvent;
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
import com.moonkage.payment.service.OutboxService;
import com.moonkage.payment.service.WalletService;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
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
    /** The buyer's wallet page on the web (routes.account.wallet). */
    private static final String WALLET_URL = "/tai-khoan/vi";

    private final WalletRepository walletRepository;
    private final WalletEntryRepository entryRepository;
    private final LedgerRepository ledgerRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final IdentityClient identityClient;

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
        Wallet wallet = walletRepository
                .findForUpdateByAccountId(accountId)
                .filter(w -> w.getBalance() >= amount)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_INSUFFICIENT));
        wallet.setBalance(wallet.getBalance() - amount);
        entryRepository.save(
                new WalletEntry(accountId, WalletEntryKind.DEBIT, WalletEntryReason.PAYMENT, amount, paymentId));
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
        Wallet wallet = walletRepository
                .findForUpdateByAccountId(buyerAccountId)
                .orElseGet(() -> walletRepository.save(new Wallet(buyerAccountId)));
        wallet.setBalance(wallet.getBalance() + held);
        WalletEntry credit = entryRepository.save(new WalletEntry(
                buyerAccountId, WalletEntryKind.CREDIT, WalletEntryReason.ORDER_REJECTED, held, orderId));
        // the order's escrow goes down by the same amount, so the money is never counted twice (NFR-09)
        ledgerService.refund(orderId, held, credit.getId(), null);
        notifyRefund(orderId, buyerAccountId, held);
    }

    /** The order as the web shows it (shortCode in web/src/shared/utils): last characters of the id, upper case. */
    private static String orderCode(String orderId) {
        String compact = orderId.replace("-", "");
        return compact.substring(Math.max(0, compact.length() - ORDER_CODE_LENGTH))
                .toUpperCase(Locale.ROOT);
    }

    /** In-app always; email only when identity-service answers, so a lookup failure never blocks the refund. */
    private void notifyRefund(String orderId, String buyerAccountId, long amount) {
        String money = NumberFormat.getIntegerInstance(Locale.of("vi", "VN")).format(amount) + " ₫";
        String code = orderCode(orderId);
        InAppNotificationEvent inApp = new InAppNotificationEvent(
                UUID.randomUUID().toString(),
                buyerAccountId,
                // the web knows ORDER, QUOTE, MAKET, DISPUTE and SYSTEM; a refund belongs with the order
                "ORDER",
                "Đã hoàn " + money + " vào ví",
                "Shop đã từ chối đơn #" + code + ". Số tiền " + money + " đã được hoàn vào ví Moonkage của bạn.",
                WALLET_URL);
        outboxService.enqueue(inApp.eventId(), RabbitConfig.INAPP_WALLET_ROUTING_KEY, inApp);

        AccountContact contact;
        try {
            contact = identityClient.contact(buyerAccountId);
        } catch (RuntimeException e) {
            log.warn("No email for the wallet refund of order {}: {}", orderId, e.getMessage());
            return;
        }
        if (contact == null || contact.email() == null) {
            return;
        }
        EmailNotificationEvent email = new EmailNotificationEvent(
                UUID.randomUUID().toString(),
                contact.email(),
                "Moonkage: đã hoàn " + money + " vào ví của bạn",
                "WALLET_REFUND",
                Map.of(
                        "userName", contact.fullName() == null ? "Quý khách" : contact.fullName(),
                        "orderCode", code,
                        "amount", money));
        outboxService.enqueue(email.eventId(), RabbitConfig.EMAIL_WALLET_ROUTING_KEY, email);
    }
}
