package com.moonkage.order.service.impl;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.DisputeEvent;
import com.moonkage.order.dto.request.EvidenceRequest;
import com.moonkage.order.dto.request.OpenDisputeRequest;
import com.moonkage.order.dto.request.ResolveDisputeRequest;
import com.moonkage.order.dto.response.DisputeResponse;
import com.moonkage.order.dto.response.PayoutLockResponse;
import com.moonkage.order.entity.Dispute;
import com.moonkage.order.entity.DisputeEvidence;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.DisputeDecision;
import com.moonkage.order.enums.DisputeParty;
import com.moonkage.order.enums.DisputeStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.DisputeEvidenceRepository;
import com.moonkage.order.repository.DisputeRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.DisputeService;
import com.moonkage.order.service.OrderAccess;
import com.moonkage.order.service.OrderFileService;
import com.moonkage.order.service.OutboxService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DisputeServiceImpl implements DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputeEvidenceRepository evidenceRepository;
    private final OrderRepository orderRepository;
    private final OrderAccess orderAccess;
    private final OrderFileService fileService;
    private final OutboxService outboxService;

    @Override
    @Transactional
    public DisputeResponse open(CurrentUserInfo caller, String orderId, OpenDisputeRequest request) {
        // the row lock is the one payout-lock takes: a dispute and a payout never pass each other (P-02)
        Order order = orderAccess.forBuyer(caller, orderId);
        Instant now = Instant.now();
        if (order.getDeliveredAt() == null
                || order.getComplaintDeadline() == null
                || now.isAfter(order.getComplaintDeadline())) {
            throw new AppException(ErrorCode.COMPLAINT_WINDOW_CLOSED);
        }
        if (order.getPayoutLockedAt() != null) {
            throw new AppException(ErrorCode.PAYOUT_LOCKED);
        }
        if (disputeRepository.existsByOrderIdAndStatus(orderId, DisputeStatus.OPEN)) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_OPEN);
        }
        Dispute dispute = new Dispute();
        dispute.setOrder(order);
        dispute.setBuyerAccountId(caller.accountId());
        dispute.setReason(request.reason());
        dispute.setDescription(request.description().trim());
        dispute.setStatus(DisputeStatus.OPEN);
        disputeRepository.saveAndFlush(dispute);
        if (request.evidences() != null) {
            request.evidences().forEach(evidence -> addEvidence(order, dispute, DisputeParty.BUYER, evidence));
        }
        announce(RabbitConfig.DISPUTE_OPENED_ROUTING_KEY, order, dispute);
        return toResponse(dispute);
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeResponse get(CurrentUserInfo caller, String orderId) {
        orderAccess.readable(caller, orderId);
        return disputeRepository
                .findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
    }

    @Override
    @Transactional
    public DisputeResponse addEvidence(CurrentUserInfo caller, String orderId, EvidenceRequest request) {
        Order order = orderAccess.readable(caller, orderId);
        DisputeParty party;
        if (orderAccess.isBuyer(caller, order)) {
            party = DisputeParty.BUYER;
        } else if (orderAccess.isVendorOwner(caller, order)) {
            party = DisputeParty.VENDOR;
        } else {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        Dispute dispute = openDispute(orderId);
        addEvidence(order, dispute, party, request);
        return toResponse(dispute);
    }

    @Override
    @Transactional
    public DisputeResponse resolve(CurrentUserInfo caller, String orderId, ResolveDisputeRequest request) {
        Order order = orderAccess.forAdmin(caller, orderId);
        Dispute dispute = openDispute(orderId);
        Long refund = switch (request.decision()) {
            case FULL_REFUND -> order.getTotalAmount();
            case PARTIAL_REFUND -> request.refundAmount();
            case REJECTED -> null;
        };
        if (request.decision() == DisputeDecision.PARTIAL_REFUND
                && (refund == null || refund <= 0 || refund >= order.getTotalAmount())) {
            throw new AppException(ErrorCode.REFUND_AMOUNT_INVALID);
        }
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setDecision(request.decision());
        dispute.setRefundAmount(refund);
        dispute.setDecisionReason(request.decisionReason().trim());
        dispute.setDecidedBy(caller.accountId());
        dispute.setResolvedAt(Instant.now());
        announce(RabbitConfig.DISPUTE_RESOLVED_ROUTING_KEY, order, dispute);
        return toResponse(dispute);
    }

    @Override
    @Transactional
    public PayoutLockResponse lockForPayout(String orderId) {
        Order order = orderRepository
                .findForUpdateById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getPayoutLockedAt() == null) {
            boolean settled = order.getReceivedConfirmedAt() != null
                    || (order.getComplaintDeadline() != null && Instant.now().isAfter(order.getComplaintDeadline()));
            if (!settled || disputeRepository.existsByOrderIdAndStatus(orderId, DisputeStatus.OPEN)) {
                throw new AppException(ErrorCode.PAYOUT_NOT_ELIGIBLE);
            }
            order.setPayoutLockedAt(Instant.now());
        }
        return new PayoutLockResponse(orderId, order.getPayoutLockedAt());
    }

    private Dispute openDispute(String orderId) {
        return disputeRepository
                .findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .filter(d -> d.getStatus() == DisputeStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));
    }

    private void addEvidence(Order order, Dispute dispute, DisputeParty party, EvidenceRequest request) {
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setDispute(dispute);
        evidence.setParty(party);
        evidence.setObjectKey(fileService.attach(order.getId(), request.tempKey()));
        evidence.setNote(request.note());
        evidenceRepository.save(evidence);
    }

    private void announce(String routingKey, Order order, Dispute dispute) {
        DisputeEvent event = new DisputeEvent(
                UUID.randomUUID().toString(),
                dispute.getId(),
                order.getId(),
                order.getVendorId(),
                order.getBuyerAccountId(),
                dispute.getReason().name(),
                dispute.getStatus().name(),
                dispute.getDecision() == null ? null : dispute.getDecision().name(),
                dispute.getRefundAmount(),
                dispute.getDecidedBy(),
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }

    private DisputeResponse toResponse(Dispute dispute) {
        List<DisputeResponse.Evidence> evidences = dispute.getId() == null
                ? List.of()
                : evidenceRepository.findByDisputeIdOrderByCreatedAtAsc(dispute.getId()).stream()
                        .map(e -> new DisputeResponse.Evidence(
                                e.getParty(), fileService.downloadUrl(e.getObjectKey()), e.getNote(), e.getCreatedAt()))
                        .toList();
        return new DisputeResponse(
                dispute.getId(),
                dispute.getOrder().getId(),
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getStatus(),
                dispute.getDecision(),
                dispute.getRefundAmount(),
                dispute.getDecisionReason(),
                dispute.getCreatedAt(),
                dispute.getResolvedAt(),
                evidences);
    }
}
