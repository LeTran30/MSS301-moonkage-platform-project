package com.moonkage.payment.service.impl;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.config.VnpayProperties;
import com.moonkage.payment.dto.event.PaymentFailedEvent;
import com.moonkage.payment.dto.event.PaymentSucceededEvent;
import com.moonkage.payment.dto.request.CreatePaymentRequest;
import com.moonkage.payment.dto.request.CreatePaymentRequest.AllocationRequest;
import com.moonkage.payment.dto.response.CreatePaymentResponse;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.PaymentResponse;
import com.moonkage.payment.dto.response.VnpayIpnResponse;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.entity.PaymentAllocation;
import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VnpayGateway;
import com.moonkage.payment.repository.PaymentAllocationRepository;
import com.moonkage.payment.repository.PaymentRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.LedgerService;
import com.moonkage.payment.service.OutboxService;
import com.moonkage.payment.service.PaymentService;
import com.moonkage.payment.service.RefundService;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final int EXPIRY_BATCH = 100;
    private static final int MAX_PAGE_SIZE = 100;

    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final LedgerService ledgerService;
    private final RefundService refundService;
    private final OutboxService outboxService;
    private final VnpayGateway vnpayGateway;
    private final VnpayProperties vnpayProperties;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Transactional
    public CreatePaymentResponse create(CreatePaymentRequest request) {
        Instant now = Instant.now();
        Instant expiresAt =
                request.expiresAt() != null ? request.expiresAt() : now.plus(vnpayProperties.getDefaultLifetime());
        if (!expiresAt.isAfter(now)) {
            throw new AppException(ErrorCode.PAYMENT_EXPIRY_INVALID);
        }
        List<AllocationRequest> shares = sharesOf(request);
        if (paymentRepository.existsByPurposeAndReferenceIdAndStatus(
                request.purpose(), request.referenceId(), PaymentStatus.SUCCEEDED)) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PAID);
        }

        if (!vnpayProperties.isConfigured()) {
            throw new AppException(ErrorCode.GATEWAY_NOT_CONFIGURED);
        }
        // 32 hex characters: unique, and only characters VNPay accepts in vnp_TxnRef
        String txnRef = UUID.randomUUID().toString().replace("-", "");
        Payment payment = new Payment();
        payment.setPurpose(request.purpose());
        payment.setReferenceId(request.referenceId());
        payment.setPayerAccountId(request.payerAccountId());
        payment.setAmount(request.amount());
        payment.setMethod("VNPAY");
        payment.setGatewayTxnRef(txnRef);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setExpiresAt(expiresAt);
        Payment saved = paymentRepository.saveAndFlush(payment);
        String paymentId = saved.getId();
        shares.forEach(
                share -> allocationRepository.save(new PaymentAllocation(paymentId, share.orderId(), share.amount())));
        // vnp_CreateDate is the payment's own creation time: the refund API asks for it back (vnp_TransactionDate)
        Instant createdAt = saved.getCreatedAt() != null ? saved.getCreatedAt() : now;
        String payUrl = vnpayGateway.payUrl(
                txnRef, request.amount(), "Moonkage " + request.purpose() + " " + txnRef, createdAt, expiresAt);
        return new CreatePaymentResponse(paymentId, payUrl);
    }

    @Override
    public VnpayIpnResponse handleIpn(Map<String, String> callback) {
        if (!vnpayGateway.isAuthentic(callback)) {
            log.warn("VNPay IPN with an invalid signature for {}", callback.get(VnpayGateway.TXN_REF));
            return VnpayIpnResponse.INVALID_SIGNATURE;
        }
        try {
            return transactionTemplate.execute(status -> recordIpn(callback));
        } catch (DataIntegrityViolationException e) {
            // P-03: another success for the same purpose and reference committed first; this one is a duplicate
            return transactionTemplate.execute(status -> recordIpn(callback));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse readReturn(Map<String, String> callback) {
        if (!vnpayGateway.isAuthentic(callback)) {
            throw new AppException(ErrorCode.GATEWAY_SIGNATURE_INVALID);
        }
        return paymentRepository
                .findByGatewayTxnRef(callback.get(VnpayGateway.TXN_REF))
                .map(PaymentServiceImpl::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> list(
            CurrentUserInfo caller, PaymentPurpose purpose, Instant from, Instant to, int page, int size) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(paymentRepository
                .search(purpose, from == null ? Instant.EPOCH : from, to == null ? Instant.now() : to, pageable)
                .map(PaymentServiceImpl::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse get(String paymentId, CurrentUserInfo caller) {
        return paymentRepository
                .findById(paymentId)
                .filter(p -> caller.isAdmin() || caller.accountId().equals(p.getPayerAccountId()))
                .map(PaymentServiceImpl::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    @Override
    @Transactional
    public int expireOverdue() {
        Instant now = Instant.now();
        List<Payment> overdue = paymentRepository.findForUpdateByStatusAndExpiresAtBefore(
                PaymentStatus.PENDING, now, PageRequest.of(0, EXPIRY_BATCH));
        overdue.forEach(payment -> fail(payment, PaymentFailedEvent.EXPIRED, now));
        return overdue.size();
    }

    /** One IPN in one transaction, the payment row locked. */
    private VnpayIpnResponse recordIpn(Map<String, String> callback) {
        Payment payment = paymentRepository
                .findForUpdateByGatewayTxnRef(callback.get(VnpayGateway.TXN_REF))
                .orElse(null);
        if (payment == null) {
            return VnpayIpnResponse.NOT_FOUND;
        }
        if (VnpayGateway.amountOf(callback) != payment.getAmount()) {
            return VnpayIpnResponse.INVALID_AMOUNT;
        }
        if (payment.getGatewayResponseCode() != null) {
            return VnpayIpnResponse.ALREADY_CONFIRMED;
        }
        payment.setGatewayResponseCode(callback.get(VnpayGateway.RESPONSE_CODE));
        payment.setGatewayTxnNo(callback.get(VnpayGateway.TRANSACTION_NO));
        if (VnpayGateway.isPaid(callback)) {
            recordPaid(payment);
        } else if (payment.getStatus() == PaymentStatus.PENDING) {
            fail(payment, PaymentFailedEvent.DECLINED, Instant.now());
        }
        return VnpayIpnResponse.CONFIRMED;
    }

    /**
     * Also for a payment already FAILED by its deadline: VNPay took the money, so it is recorded and announced, and
     * the owner of the reference decides whether it still holds (P-01).
     */
    private void recordPaid(Payment payment) {
        payment.setPaidAt(Instant.now());
        if (paymentRepository.existsByPurposeAndReferenceIdAndStatus(
                payment.getPurpose(), payment.getReferenceId(), PaymentStatus.SUCCEEDED)) {
            payment.setStatus(PaymentStatus.DUPLICATE);
            refundService.requestAutomatic(payment.getId(), RefundReason.DUPLICATE_PAYMENT, payment.getAmount());
            log.warn(
                    "Payment {} is a second success for {} {}; refunding it",
                    payment.getId(),
                    payment.getPurpose(),
                    payment.getReferenceId());
            return;
        }
        payment.setStatus(PaymentStatus.SUCCEEDED);
        // the unique index on (purpose, reference) fails here when another success committed meanwhile
        paymentRepository.saveAndFlush(payment);
        allocationRepository
                .findByPaymentId(payment.getId())
                .forEach(share -> ledgerService.collect(share.getOrderId(), share.getAmount(), payment.getId()));
        PaymentSucceededEvent event = new PaymentSucceededEvent(
                UUID.randomUUID().toString(),
                payment.getId(),
                payment.getPurpose().name(),
                payment.getReferenceId(),
                payment.getAmount(),
                payment.getPaidAt());
        outboxService.enqueue(event.eventId(), RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY, event);
    }

    private void fail(Payment payment, String reason, Instant failedAt) {
        payment.setStatus(PaymentStatus.FAILED);
        PaymentFailedEvent event = new PaymentFailedEvent(
                UUID.randomUUID().toString(),
                payment.getId(),
                payment.getPurpose().name(),
                payment.getReferenceId(),
                payment.getAmount(),
                reason,
                payment.getGatewayResponseCode(),
                failedAt);
        outboxService.enqueue(event.eventId(), RabbitConfig.PAYMENT_FAILED_ROUTING_KEY, event);
    }

    /**
     * The share of each order (BR-29), checked at commit by the database once the payment succeeds (P-04). A deposit
     * goes to the custom order order-service creates under the acceptance's id; a remainder to its order.
     */
    private static List<AllocationRequest> sharesOf(CreatePaymentRequest request) {
        List<AllocationRequest> given = request.allocations() == null ? List.of() : request.allocations();
        if (request.purpose() != PaymentPurpose.CHECKOUT) {
            if (!given.isEmpty()) {
                throw new AppException(ErrorCode.ALLOCATIONS_INVALID);
            }
            return request.purpose() == PaymentPurpose.REGISTRATION_FEE
                    ? List.of()
                    : List.of(new AllocationRequest(request.referenceId(), request.amount()));
        }
        long total = given.stream().mapToLong(AllocationRequest::amount).sum();
        boolean distinct =
                new HashSet<>(given.stream().map(AllocationRequest::orderId).toList()).size() == given.size();
        if (given.isEmpty() || total != request.amount() || !distinct) {
            throw new AppException(ErrorCode.ALLOCATIONS_INVALID);
        }
        return given;
    }

    private static PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPurpose(),
                payment.getReferenceId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getGatewayResponseCode(),
                payment.getExpiresAt(),
                payment.getPaidAt());
    }
}
