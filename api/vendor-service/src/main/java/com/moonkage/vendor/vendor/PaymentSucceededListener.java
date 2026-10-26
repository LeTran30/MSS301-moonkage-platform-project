package com.moonkage.vendor.vendor;

import com.moonkage.vendor.client.dto.PaymentPurpose;
import com.moonkage.vendor.client.dto.PaymentSucceededEvent;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.inbox.InboxService;
import com.moonkage.vendor.outbox.OutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records the registration fee when payment-service announces it paid (BR-31, AC-27.5). The mark in processed_events,
 * the vendor's fee columns and vendor.registration_fee_paid commit together, so a redelivery changes nothing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class PaymentSucceededListener {

    private final VendorRepository vendorRepository;
    private final InboxService inboxService;
    private final OutboxService outboxService;

    @Transactional
    @RabbitListener(queues = RabbitConfig.PAYMENT_EVENTS_QUEUE)
    public void onPaymentSucceeded(PaymentSucceededEvent event) {
        if (!event.isFor(PaymentPurpose.REGISTRATION_FEE)
                || !inboxService.markProcessed(event.eventId(), RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY)) {
            return;
        }
        Vendor vendor = vendorRepository.findById(event.referenceId()).orElse(null);
        if (vendor == null) {
            log.error(
                    "payment.succeeded {} names vendor {}, which does not exist", event.eventId(), event.referenceId());
            return;
        }
        if (!vendor.recordRegistrationFee(event.paymentId(), new Price(event.amount()), event.paidAt())) {
            // payment-service refunds a second success itself (P-03); the first payment stays the one recorded
            log.warn(
                    "Vendor {} already paid with payment {}; payment {} not recorded",
                    vendor.getId(),
                    vendor.getRegistrationFeePaymentId(),
                    event.paymentId());
            return;
        }
        VendorRegistrationFeePaidEvent paid = VendorRegistrationFeePaidEvent.of(vendor);
        outboxService.enqueue(paid.eventId(), RabbitConfig.VENDOR_REGISTRATION_FEE_PAID_ROUTING_KEY, paid);
    }
}
