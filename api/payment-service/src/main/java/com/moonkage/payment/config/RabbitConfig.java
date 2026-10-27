package com.moonkage.payment.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarable;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Domain events go to the one topic exchange every service shares (Software Design 5.4, integration.md). */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";

    // read by order (CHECKOUT, REMAINDER), quotation (DEPOSIT) and vendor (REGISTRATION_FEE)
    public static final String PAYMENT_SUCCEEDED_ROUTING_KEY = "payment.succeeded";
    public static final String PAYMENT_FAILED_ROUTING_KEY = "payment.failed";
    // read by order and orchestrator
    public static final String REFUND_COMPLETED_ROUTING_KEY = "refund.completed";
    public static final String REFUND_MANUAL_REQUIRED_ROUTING_KEY = "refund.manual_required";
    public static final String DISBURSEMENT_REQUESTED_ROUTING_KEY = "disbursement.requested";
    public static final String DISBURSEMENT_REVIEWED_ROUTING_KEY = "disbursement.reviewed";
    public static final String PAYOUT_COMPLETED_ROUTING_KEY = "payout.completed";

    // sent by order-service, read here (order_snapshots, dispute refunds)
    public static final String DISPUTE_OPENED_ROUTING_KEY = "dispute.opened";
    public static final String DISPUTE_RESOLVED_ROUTING_KEY = "dispute.resolved";
    private static final List<String> ORDER_ROUTING_KEYS =
            List.of("order.created", "order.status_changed", "order.delivered", "order.received_confirmed");
    public static final String ORDER_EVENTS_QUEUE = "payment-service.order-events";
    public static final String DISPUTE_OPENED_QUEUE = "payment-service.dispute-opened";
    public static final String DISPUTE_RESOLVED_QUEUE = "payment-service.dispute-resolved";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    /** Durable queues: nothing order-service says is lost while payment-service is down. */
    @Bean
    Declarables orderEventBindings(TopicExchange eventsExchange) {
        Queue orderEvents = QueueBuilder.durable(ORDER_EVENTS_QUEUE).build();
        Queue disputeOpened = QueueBuilder.durable(DISPUTE_OPENED_QUEUE).build();
        Queue disputeResolved = QueueBuilder.durable(DISPUTE_RESOLVED_QUEUE).build();
        List<Declarable> declarables = new ArrayList<>(List.of(orderEvents, disputeOpened, disputeResolved));
        ORDER_ROUTING_KEYS.forEach(key -> declarables.add(
                BindingBuilder.bind(orderEvents).to(eventsExchange).with(key)));
        declarables.add(BindingBuilder.bind(disputeOpened).to(eventsExchange).with(DISPUTE_OPENED_ROUTING_KEY));
        declarables.add(BindingBuilder.bind(disputeResolved).to(eventsExchange).with(DISPUTE_RESOLVED_ROUTING_KEY));
        return new Declarables(declarables);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
