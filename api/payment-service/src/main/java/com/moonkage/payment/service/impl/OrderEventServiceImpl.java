package com.moonkage.payment.service.impl;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.DisputeEvent;
import com.moonkage.payment.dto.event.OrderEvent;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.service.InboxService;
import com.moonkage.payment.service.LedgerService;
import com.moonkage.payment.service.OrderEventService;
import com.moonkage.payment.service.RefundService;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderEventServiceImpl implements OrderEventService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderSnapshotRepository snapshotRepository;
    private final InboxService inboxService;
    private final LedgerService ledgerService;
    private final RefundService refundService;

    @Override
    @Transactional
    public void onOrderEvent(String routingKey, OrderEvent event) {
        if (!inboxService.markProcessed(event.eventId(), routingKey)) {
            return;
        }
        OrderSnapshot snapshot =
                snapshotRepository.findForUpdateByOrderId(event.orderId()).orElseGet(OrderSnapshot::new);
        if (snapshot.getOrderId() != null && snapshot.getSourceVersion() >= event.sourceVersion()) {
            return;
        }
        snapshot.setOrderId(event.orderId());
        snapshot.setVendorId(event.vendorId());
        snapshot.setKind(event.kind());
        snapshot.setInterprovince(event.interprovince());
        snapshot.setTotalAmount(event.totalAmount());
        snapshot.setStatus(event.status());
        snapshot.setComplaintDeadline(event.complaintDeadline());
        snapshot.setReceivedConfirmed(event.receivedConfirmed());
        snapshot.setSourceVersion(event.sourceVersion());
        snapshotRepository.save(snapshot);
        ledgerService.describe(event.orderId(), event.vendorId(), expectedPayoutDate(snapshot));
    }

    @Override
    @Transactional
    public void onDisputeOpened(DisputeEvent event) {
        if (!inboxService.markProcessed(event.eventId(), RabbitConfig.DISPUTE_OPENED_ROUTING_KEY)) {
            return;
        }
        snapshotRepository.findForUpdateByOrderId(event.orderId()).ifPresent(snapshot -> {
            snapshot.setDisputeOpen(true);
            // AC-43.3: an order under dispute has no expected payout date
            ledgerService.describe(event.orderId(), snapshot.getVendorId(), null);
        });
    }

    @Override
    @Transactional
    public void onDisputeResolved(DisputeEvent event) {
        if (!inboxService.markProcessed(event.eventId(), RabbitConfig.DISPUTE_RESOLVED_ROUTING_KEY)) {
            return;
        }
        snapshotRepository.findForUpdateByOrderId(event.orderId()).ifPresent(snapshot -> {
            snapshot.setDisputeOpen(false);
            ledgerService.describe(event.orderId(), snapshot.getVendorId(), expectedPayoutDate(snapshot));
        });
        if (event.refundAmount() != null && event.refundAmount() > 0) {
            refundService.requestForDispute(event.orderId(), event.disputeId(), event.refundAmount());
        }
    }

    /** AC-43.1: the day the complaint window closes, unless a dispute holds the money. */
    private static LocalDate expectedPayoutDate(OrderSnapshot snapshot) {
        if (snapshot.isDisputeOpen() || snapshot.getComplaintDeadline() == null) {
            return null;
        }
        return LocalDate.ofInstant(snapshot.getComplaintDeadline(), VIETNAM);
    }
}
