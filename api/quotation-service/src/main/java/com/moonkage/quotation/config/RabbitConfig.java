package com.moonkage.quotation.config;

import com.moonkage.outbox.EventExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Domain events go to the one topic exchange every service shares (Software Design 5.4, integration.md). One durable
 * queue per event read, so each listener gets its own payload type and nothing is lost while quotation-service is
 * down.
 */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = EventExchange.NAME;

    // sent by quotation-service: quote.accepted is read by order-service
    public static final String QUOTE_ACCEPTED_ROUTING_KEY = "quote.accepted";
    public static final String QUOTE_SUBMITTED_ROUTING_KEY = "quote.submitted";
    public static final String QUOTE_WITHDRAWN_ROUTING_KEY = "quote.withdrawn";
    public static final String REQUEST_CREATED_ROUTING_KEY = "request.created";
    public static final String REQUEST_DECLINED_ROUTING_KEY = "request.declined";

    // sent by payment-service: the deposit of an acceptance (purpose DEPOSIT)
    public static final String PAYMENT_SUCCEEDED_ROUTING_KEY = "payment.succeeded";
    public static final String PAYMENT_FAILED_ROUTING_KEY = "payment.failed";

    public static final String PAYMENT_SUCCEEDED_QUEUE = "quotation-service.payment-succeeded";
    public static final String PAYMENT_FAILED_QUEUE = "quotation-service.payment-failed";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    Queue paymentSucceededQueue() {
        return QueueBuilder.durable(PAYMENT_SUCCEEDED_QUEUE).build();
    }

    @Bean
    Queue paymentFailedQueue() {
        return QueueBuilder.durable(PAYMENT_FAILED_QUEUE).build();
    }

    @Bean
    Binding paymentSucceededBinding(Queue paymentSucceededQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(paymentSucceededQueue).to(eventsExchange).with(PAYMENT_SUCCEEDED_ROUTING_KEY);
    }

    @Bean
    Binding paymentFailedBinding(Queue paymentFailedQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(paymentFailedQueue).to(eventsExchange).with(PAYMENT_FAILED_ROUTING_KEY);
    }

    /** The listener's parameter type decides the target class, not the publisher's __TypeId__ header. */
    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
