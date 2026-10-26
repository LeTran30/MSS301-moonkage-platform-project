package com.moonkage.order.messaging;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.PaymentFailedEvent;
import com.moonkage.order.dto.event.PaymentSucceededEvent;
import com.moonkage.order.service.CheckoutService;
import com.moonkage.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * payment.succeeded and payment.failed of the payments order-service owns: CHECKOUT (referenceId = checkoutId) and
 * REMAINDER (referenceId = orderId). Other purposes are someone else's and ignored. A deposit reaches order-service
 * as quote.accepted, after quotation-service took it.
 */
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private static final String CHECKOUT = "CHECKOUT";
    private static final String REMAINDER = "REMAINDER";

    private final CheckoutService checkoutService;
    private final OrderService orderService;

    @RabbitListener(queues = RabbitConfig.PAYMENT_SUCCEEDED_QUEUE)
    public void onSucceeded(PaymentSucceededEvent event) {
        if (CHECKOUT.equals(event.purpose())) {
            checkoutService.onPaid(event.eventId(), event.referenceId(), event.paymentId());
        } else if (REMAINDER.equals(event.purpose())) {
            orderService.onRemainderPaid(event.eventId(), event.referenceId());
        }
    }

    @RabbitListener(queues = RabbitConfig.PAYMENT_FAILED_QUEUE)
    public void onFailed(PaymentFailedEvent event) {
        if (CHECKOUT.equals(event.purpose())) {
            checkoutService.onPaymentFailed(event.eventId(), event.referenceId());
        }
    }
}
