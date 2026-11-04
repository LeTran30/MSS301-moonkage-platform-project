package com.moonkage.quotation.messaging;

import com.moonkage.quotation.config.RabbitConfig;
import com.moonkage.quotation.dto.event.PaymentFailedEvent;
import com.moonkage.quotation.dto.event.PaymentSucceededEvent;
import com.moonkage.quotation.service.QuoteAcceptanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * payment.succeeded and payment.failed of the deposits quotation-service owns (purpose DEPOSIT, referenceId is the
 * acceptanceId). Other purposes are someone else's and ignored.
 *
 * <p>The deposit is what makes an acceptance succeed: without this listener the acceptance would stay
 * PENDING_PAYMENT forever and the buyer would poll a status that never changes.
 */
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private static final String DEPOSIT = "DEPOSIT";

    private final QuoteAcceptanceService quoteAcceptanceService;

    @RabbitListener(queues = RabbitConfig.PAYMENT_SUCCEEDED_QUEUE)
    public void onSucceeded(PaymentSucceededEvent event) {
        if (DEPOSIT.equals(event.purpose())) {
            quoteAcceptanceService.recordDepositPaid(event.eventId(), event.referenceId(), event.paidAt());
        }
    }

    @RabbitListener(queues = RabbitConfig.PAYMENT_FAILED_QUEUE)
    public void onFailed(PaymentFailedEvent event) {
        if (DEPOSIT.equals(event.purpose())) {
            quoteAcceptanceService.recordDepositFailed(event.eventId(), event.referenceId());
        }
    }
}
