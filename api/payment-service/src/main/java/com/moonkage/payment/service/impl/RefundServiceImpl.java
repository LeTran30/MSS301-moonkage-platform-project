package com.moonkage.payment.service.impl;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.MoneyEvent;
import com.moonkage.payment.dto.request.RefundRequest;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.entity.PaymentAllocation;
import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.enums.PaymentStatus;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VnpayRefundClient;
import com.moonkage.payment.gateway.VnpayRefundClient.RefundResult;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.PaymentAllocationRepository;
import com.moonkage.payment.repository.PaymentRepository;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.LedgerService;
import com.moonkage.payment.service.OutboxService;
import com.moonkage.payment.service.RefundService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private static final int BATCH = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final String SYSTEM = "system";

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final VnpayRefundClient refundClient;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void requestAutomatic(String paymentId, RefundReason reason, long amount) {
        if (reason == RefundReason.DISPUTE) {
            throw new IllegalArgumentException("A dispute refund belongs to an order and a dispute");
        }
        if (refundRepository.existsByOriginalPaymentIdAndReason(paymentId, reason)) {
            return;
        }
        refundRepository.save(Refund.automatic(paymentId, reason, amount));
    }

    @Override
    @Transactional
    public void requestForPayment(RefundRequest request) {
        if (request.reason() == RefundReason.DISPUTE) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        Payment payment = paymentRepository
                .findById(request.paymentId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        boolean tookMoney =
                payment.getStatus() == PaymentStatus.SUCCEEDED || payment.getStatus() == PaymentStatus.DUPLICATE;
        if (!tookMoney || request.amount() > payment.getAmount()) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        requestAutomatic(payment.getId(), request.reason(), request.amount());
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void requestForDispute(String orderId, String disputeId, long amount) {
        if (refundRepository.existsByDisputeId(disputeId)) {
            return;
        }
        String paymentId =
                ledgerEntryRepository
                        .findByOrderIdAndKindOrderByCreatedAtDesc(orderId, LedgerEntryKind.COLLECT)
                        .stream()
                        .map(LedgerEntry::getReferenceId)
                        .findFirst()
                        .orElse(null);
        if (paymentId == null) {
            log.error("Dispute {} refunds order {}, which has no payment", disputeId, orderId);
            return;
        }
        refundRepository.save(Refund.dispute(orderId, disputeId, paymentId, amount));
    }

    @Override
    public int processPending() {
        List<String> pending = transactionTemplate.execute(status ->
                refundRepository.findForUpdateByStatus(RefundStatus.PENDING, PageRequest.of(0, BATCH)).stream()
                        .map(Refund::getId)
                        .toList());
        if (pending == null) {
            return 0;
        }
        pending.forEach(id -> transactionTemplate.executeWithoutResult(status -> process(id)));
        return pending.size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> listForOrder(String orderId) {
        return refundRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(RefundServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> list(RefundStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(refundRepository
                .findByStatusOrderByCreatedAtAsc(status, pageable)
                .map(RefundServiceImpl::toResponse));
    }

    @Override
    @Transactional
    public RefundResponse confirmManual(CurrentUserInfo caller, String refundId) {
        Refund refund = refundRepository
                .findForUpdateById(refundId)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));
        if (refund.getStatus() != RefundStatus.MANUAL_REQUIRED) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        if (!canBook(refund)) {
            // Q-01: more than the platform still holds (deposit already disbursed); the admin settled it outside
            log.warn("Refund {} confirmed by hand without a ledger entry: more than held", refundId);
        } else {
            book(refund, caller.accountId());
        }
        refund.setStatus(RefundStatus.SUCCEEDED);
        announce(RabbitConfig.REFUND_COMPLETED_ROUTING_KEY, refund, caller.accountId());
        return toResponse(refund);
    }

    /** One refund in one transaction, its row locked. */
    private void process(String refundId) {
        Refund refund = refundRepository.findForUpdateById(refundId).orElse(null);
        if (refund == null || refund.getStatus() != RefundStatus.PENDING) {
            return;
        }
        Payment payment =
                paymentRepository.findById(refund.getOriginalPaymentId()).orElseThrow();
        if (!canBook(refund)) {
            fail(refund, "Số hoàn vượt số nền tảng đang giữ của đơn (Q-01)");
            return;
        }
        RefundResult result = refundClient.refund(
                payment.getGatewayTxnRef(),
                payment.getGatewayTxnNo(),
                payment.getCreatedAt(),
                payment.getAmount(),
                refund.getAmount(),
                SYSTEM);
        if (!result.success()) {
            fail(refund, result.error());
            return;
        }
        refund.setGatewayRefundRef(result.gatewayRef());
        refund.setStatus(RefundStatus.SUCCEEDED);
        book(refund, null);
        announce(RabbitConfig.REFUND_COMPLETED_ROUTING_KEY, refund, null);
    }

    private void fail(Refund refund, String error) {
        refund.setStatus(RefundStatus.MANUAL_REQUIRED);
        refund.setError(error);
        announce(RabbitConfig.REFUND_MANUAL_REQUIRED_ROUTING_KEY, refund, null);
    }

    /**
     * Where the money left from: a dispute refund from its order; a late payment or expired quote from the orders the
     * payment was booked on (they never started); a duplicate was never booked.
     */
    private boolean canBook(Refund refund) {
        return switch (refund.getReason()) {
            case DISPUTE -> ledgerService.holds(refund.getOrderId(), refund.getAmount());
            case LATE_PAYMENT, QUOTE_EXPIRED ->
                sharesOf(refund).stream().allMatch(share -> ledgerService.holds(share.getOrderId(), share.getAmount()));
            case DUPLICATE_PAYMENT -> true;
        };
    }

    private void book(Refund refund, String actorAccountId) {
        if (refund.getReason() == RefundReason.DISPUTE) {
            ledgerService.refund(refund.getOrderId(), refund.getAmount(), refund.getId(), actorAccountId);
        } else if (refund.getReason() != RefundReason.DUPLICATE_PAYMENT) {
            sharesOf(refund)
                    .forEach(share -> ledgerService.refund(
                            share.getOrderId(), share.getAmount(), refund.getId(), actorAccountId));
        }
        // a duplicate never reached a ledger (P-03)
    }

    /** The whole payment goes back, so each order gets back what the payment brought it. */
    private List<PaymentAllocation> sharesOf(Refund refund) {
        Payment payment =
                paymentRepository.findById(refund.getOriginalPaymentId()).orElseThrow();
        if (payment.getStatus() != PaymentStatus.SUCCEEDED) {
            return List.of();
        }
        return allocationRepository.findByPaymentId(payment.getId());
    }

    private void announce(String routingKey, Refund refund, String actorAccountId) {
        MoneyEvent event = new MoneyEvent(
                UUID.randomUUID().toString(),
                refund.getOrderId(),
                null,
                refund.getId(),
                refund.getAmount(),
                refund.getStatus().name(),
                refund.getReason().name(),
                actorAccountId,
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }

    private static RefundResponse toResponse(Refund refund) {
        return new RefundResponse(
                refund.getId(),
                refund.getOrderId(),
                refund.getDisputeId(),
                refund.getOriginalPaymentId(),
                refund.getReason(),
                refund.getAmount(),
                refund.getStatus(),
                refund.getError(),
                refund.getCreatedAt());
    }
}
