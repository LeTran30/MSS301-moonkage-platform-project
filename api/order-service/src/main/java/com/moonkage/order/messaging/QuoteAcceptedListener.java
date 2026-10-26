package com.moonkage.order.messaging;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.QuoteAcceptedEvent;
import com.moonkage.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/** quote.accepted: the deposit is paid, the custom order is created from the agreed snapshot (FR-19, D-12). */
@Component
@RequiredArgsConstructor
public class QuoteAcceptedListener {

    private final OrderService orderService;

    @RabbitListener(queues = RabbitConfig.QUOTE_ACCEPTED_QUEUE)
    public void onQuoteAccepted(QuoteAcceptedEvent event) {
        orderService.createFromQuote(event);
    }
}
