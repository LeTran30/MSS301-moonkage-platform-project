package com.moonkage.payment.service.impl;

import com.moonkage.payment.client.OrderClient;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.MoneyEvent;
import com.moonkage.payment.dto.request.CreateDisbursementRequest;
import com.moonkage.payment.dto.request.ReviewDisbursementRequest;
import com.moonkage.payment.dto.response.DisbursementResponse;
import com.moonkage.payment.dto.response.LedgerEntryResponse;
import com.moonkage.payment.dto.response.LedgerResponse;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.PayoutResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.entity.DisbursementRequest;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.entity.Payout;
import com.moonkage.payment.enums.DisbursementStatus;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.repository.DisbursementRequestRepository;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.repository.PayoutRepository;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.LedgerService;
import com.moonkage.payment.service.OutboxService;
import com.moonkage.payment.service.ReconciliationService;
import com.moonkage.payment.service.RefundService;
import com.moonkage.payment.service.VendorDirectory;
import feign.FeignException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ReconciliationServiceImpl implements ReconciliationService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final String CUSTOM_ORDER = "CUSTOM_ORDER";

    private final LedgerRepository ledgerRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final OrderSnapshotRepository snapshotRepository;
    private final DisbursementRequestRepository disbursementRepository;
    private final PayoutRepository payoutRepository;
    private final RefundRepository refundRepository;
    private final LedgerService ledgerService;
    private final RefundService refundService;
    private final OutboxService outboxService;
    private final VendorDirectory vendorDirectory;
    private final OrderClient orderClient;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LedgerResponse> list(
            CurrentUserInfo caller, String vendorId, boolean payableOnly, int page, int size) {
        if (!caller.isAdmin() && (vendorId == null || !ownsVendor(caller, vendorId))) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        Instant now = Instant.now();
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(
                ledgerRepository.search(vendorId, payableOnly, now, pageable).map(l -> toResponse(l, now)));
    }

    @Override
    @Transactional(readOnly = true)
    public LedgerResponse get(CurrentUserInfo caller, String orderId) {
        return toResponse(readable(caller, orderId), Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> entries(CurrentUserInfo caller, String orderId) {
        readable(caller, orderId);
        return ledgerEntryRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(e -> new LedgerEntryResponse(
                        e.getKind(), e.getAmount(), e.getReferenceId(), e.getActorAccountId(), e.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> refunds(CurrentUserInfo caller, String orderId) {
        readable(caller, orderId);
        return refundService.listForOrder(orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisbursementResponse> disbursements(CurrentUserInfo caller, String orderId) {
        readable(caller, orderId);
        return disbursementRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(ReconciliationServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DisbursementResponse requestDisbursement(
            CurrentUserInfo caller, String orderId, CreateDisbursementRequest request) {
        Ledger ledger = ledgerRepository
                .findForUpdateByOrderId(orderId)
                .filter(l -> l.getVendorId() != null && ownsVendor(caller, l.getVendorId()))
                .orElseThrow(() -> new AppException(ErrorCode.LEDGER_NOT_FOUND));
        boolean customOrder = snapshotRepository
                .findById(orderId)
                .map(OrderSnapshot::getKind)
                .filter(CUSTOM_ORDER::equals)
                .isPresent();
        if (!customOrder || payoutRepository.existsByOrderId(orderId)) {
            throw new AppException(ErrorCode.DISBURSEMENT_NOT_ALLOWED);
        }
        long waiting = disbursementRepository.sumAmountByOrderIdAndStatus(orderId, DisbursementStatus.PENDING);
        if (waiting + request.amount() > ledger.getHeld()) {
            throw new AppException(ErrorCode.DISBURSEMENT_OVER_HELD);
        }
        DisbursementRequest disbursement = new DisbursementRequest();
        disbursement.setOrderId(orderId);
        disbursement.setVendorId(ledger.getVendorId());
        disbursement.setAmount(request.amount());
        disbursement.setPurpose(request.purpose());
        disbursement.setStatus(DisbursementStatus.PENDING);
        disbursementRepository.saveAndFlush(disbursement);
        announce(
                RabbitConfig.DISBURSEMENT_REQUESTED_ROUTING_KEY,
                orderId,
                ledger.getVendorId(),
                disbursement.getId(),
                request.amount(),
                DisbursementStatus.PENDING.name(),
                request.purpose().name(),
                caller.accountId());
        return toResponse(disbursement);
    }

    @Override
    @Transactional
    public DisbursementResponse reviewDisbursement(
            CurrentUserInfo caller, String orderId, String requestId, ReviewDisbursementRequest request) {
        requireAdmin(caller);
        DisbursementRequest disbursement = disbursementRepository
                .findForUpdate(orderId, requestId)
                .orElseThrow(() -> new AppException(ErrorCode.DISBURSEMENT_NOT_FOUND));
        if (disbursement.getStatus() != DisbursementStatus.PENDING || request.status() == DisbursementStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        if (request.status() == DisbursementStatus.REJECTED) {
            if (!StringUtils.hasText(request.reason())) {
                throw new AppException(ErrorCode.REASON_REQUIRED);
            }
            disbursement.setReason(request.reason().trim());
        } else {
            long approved = request.approvedAmount() == null ? disbursement.getAmount() : request.approvedAmount();
            if (approved <= 0 || approved > disbursement.getAmount()) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            // LEDGER_002 when the deposit held no longer covers it (AC-48.2)
            ledgerService.disburse(orderId, approved, requestId, caller.accountId());
            disbursement.setApprovedAmount(approved);
        }
        disbursement.setStatus(request.status());
        disbursement.setDecidedBy(caller.accountId());
        disbursement.setDecidedAt(Instant.now());
        announce(
                RabbitConfig.DISBURSEMENT_REVIEWED_ROUTING_KEY,
                orderId,
                disbursement.getVendorId(),
                requestId,
                disbursement.getApprovedAmount() == null ? disbursement.getAmount() : disbursement.getApprovedAmount(),
                request.status().name(),
                disbursement.getReason(),
                caller.accountId());
        return toResponse(disbursement);
    }

    @Override
    public PayoutResponse payout(CurrentUserInfo caller, String orderId) {
        requireAdmin(caller);
        Boolean ready = transactionTemplate.execute(status -> {
            if (ledgerRepository.findByOrderId(orderId).isEmpty()) {
                throw new AppException(ErrorCode.LEDGER_NOT_FOUND);
            }
            if (payoutRepository.existsByOrderId(orderId)) {
                throw new AppException(ErrorCode.ALREADY_PAID_OUT);
            }
            return !refundRepository.existsByOrderIdAndStatusIn(
                            orderId, Set.of(RefundStatus.PENDING, RefundStatus.MANUAL_REQUIRED))
                    && disbursementRepository.sumAmountByOrderIdAndStatus(orderId, DisbursementStatus.PENDING) == 0;
        });
        if (!Boolean.TRUE.equals(ready)) {
            throw new AppException(ErrorCode.PAYOUT_NOT_ELIGIBLE);
        }
        try {
            // P-02: order-service is the one place that knows no dispute can open any more
            orderClient.lockForPayout(orderId);
        } catch (FeignException.Conflict e) {
            throw new AppException(ErrorCode.PAYOUT_NOT_ELIGIBLE);
        }
        return transactionTemplate.execute(status -> {
            Ledger ledger = ledgerRepository.findForUpdateByOrderId(orderId).orElseThrow();
            if (payoutRepository.existsByOrderId(orderId)) {
                throw new AppException(ErrorCode.ALREADY_PAID_OUT);
            }
            long amount = ledger.getHeld();
            Payout payout = Payout.of(orderId, ledger.getVendorId(), amount, caller.accountId());
            payoutRepository.saveAndFlush(payout);
            if (amount > 0) {
                ledgerService.payout(orderId, amount, payout.getId(), caller.accountId());
            }
            announce(
                    RabbitConfig.PAYOUT_COMPLETED_ROUTING_KEY,
                    orderId,
                    ledger.getVendorId(),
                    payout.getId(),
                    amount,
                    "COMPLETED",
                    null,
                    caller.accountId());
            return new PayoutResponse(payout.getId(), orderId, ledger.getVendorId(), amount, payout.getCreatedAt());
        });
    }

    /** The vendor's owner or an admin; anyone else gets LEDGER_001, so the order's money does not leak. */
    private Ledger readable(CurrentUserInfo caller, String orderId) {
        return ledgerRepository
                .findByOrderId(orderId)
                .filter(l -> caller.isAdmin() || (l.getVendorId() != null && ownsVendor(caller, l.getVendorId())))
                .orElseThrow(() -> new AppException(ErrorCode.LEDGER_NOT_FOUND));
    }

    private boolean ownsVendor(CurrentUserInfo caller, String vendorId) {
        return vendorDirectory
                .ownedVendorId(caller.accountId())
                .filter(vendorId::equals)
                .isPresent();
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private LedgerResponse toResponse(Ledger ledger, Instant now) {
        OrderSnapshot snapshot =
                snapshotRepository.findById(ledger.getOrderId()).orElse(null);
        boolean paidOut = payoutRepository.existsByOrderId(ledger.getOrderId());
        return new LedgerResponse(
                ledger.getOrderId(),
                ledger.getVendorId(),
                snapshot == null ? null : snapshot.getKind(),
                snapshot == null ? null : snapshot.getStatus(),
                ledger.getTotalCollected(),
                ledger.getHeld(),
                ledger.getDisbursed(),
                ledger.getRefunded(),
                ledger.getPaidOut(),
                paidOut ? 0L : ledger.getHeld(),
                ledger.getExpectedPayoutDate(),
                snapshot != null && snapshot.isDisputeOpen(),
                !paidOut && snapshot != null && snapshot.looksPayable(now));
    }

    private void announce(
            String routingKey,
            String orderId,
            String vendorId,
            String referenceId,
            long amount,
            String status,
            String reason,
            String actorAccountId) {
        MoneyEvent event = new MoneyEvent(
                UUID.randomUUID().toString(),
                orderId,
                vendorId,
                referenceId,
                amount,
                status,
                reason,
                actorAccountId,
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }

    private static DisbursementResponse toResponse(DisbursementRequest d) {
        return new DisbursementResponse(
                d.getId(),
                d.getOrderId(),
                d.getAmount(),
                d.getApprovedAmount(),
                d.getPurpose(),
                d.getStatus(),
                d.getReason(),
                d.getCreatedAt(),
                d.getDecidedAt());
    }
}
