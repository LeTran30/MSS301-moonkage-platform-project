package com.moonkage.payment.messaging;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.DisputeEvent;
import com.moonkage.payment.dto.event.OrderEvent;
import com.moonkage.payment.service.OrderEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/** order.* and dispute.* from order-service (integration.md). */
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final OrderEventService orderEventService;

    @RabbitListener(queues = RabbitConfig.ORDER_EVENTS_QUEUE)
    public void onOrderEvent(OrderEvent event, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        orderEventService.onOrderEvent(routingKey, event);
    }

    @RabbitListener(queues = RabbitConfig.DISPUTE_OPENED_QUEUE)
    public void onDisputeOpened(DisputeEvent event) {
        orderEventService.onDisputeOpened(event);
    }

    @RabbitListener(queues = RabbitConfig.DISPUTE_RESOLVED_QUEUE)
    public void onDisputeResolved(DisputeEvent event) {
        orderEventService.onDisputeResolved(event);
    }
}
