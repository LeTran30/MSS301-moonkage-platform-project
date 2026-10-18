package com.moonkage.notification.infrastructure.messaging;

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
 * RabbitMQ infrastructure topology for notification-service.
 * Declares domain topic exchange, dead-letter exchange, isolated channel queues, and DLQ bindings.
 */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";
    public static final String EVENTS_DLX = "moonkage.events.dlx";

    public static final String AUDIT_QUEUE = "notification.audit";
    public static final String EMAIL_QUEUE = "notification.email.queue";
    public static final String EMAIL_DLQ = "notification.email.dlq";
    public static final String INAPP_QUEUE = "notification.inapp.queue";

    public static final String EMAIL_ROUTING_KEY = "notification.email.#";
    public static final String EMAIL_DLQ_ROUTING_KEY = "notification.email.dlq";
    public static final String INAPP_ROUTING_KEY = "notification.inapp.#";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    TopicExchange deadLetterExchange() {
        return new TopicExchange(EVENTS_DLX, true, false);
    }

    /** Durable: audit events sent while this service is down wait in the queue. */
    @Bean
    Queue auditQueue() {
        return new Queue(AUDIT_QUEUE, true);
    }

    /** audit.catalog, audit.vendor, audit.payment, ... */
    @Bean
    Binding auditBinding(Queue auditQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(auditQueue).to(eventsExchange).with("audit.#");
    }

    /**
     * Durable email queue with Dead Letter Exchange configuration.
     * Messages rejected or failing max retry attempts are redirected to DLX.
     */
    @Bean
    Queue emailQueue() {
        return QueueBuilder.durable(EMAIL_QUEUE)
                .withArgument("x-dead-letter-exchange", EVENTS_DLX)
                .withArgument("x-dead-letter-routing-key", EMAIL_DLQ_ROUTING_KEY)
                .build();
    }

    /** Dead Letter Queue holding unprocessable or poisoned email notification messages. */
    @Bean
    Queue emailDeadLetterQueue() {
        return QueueBuilder.durable(EMAIL_DLQ).build();
    }

    @Bean
    Binding emailBinding(Queue emailQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(emailQueue).to(eventsExchange).with(EMAIL_ROUTING_KEY);
    }

    @Bean
    Binding emailDeadLetterBinding(Queue emailDeadLetterQueue, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(emailDeadLetterQueue).to(deadLetterExchange).with(EMAIL_DLQ_ROUTING_KEY);
    }

    /** Durable queue for in-app notifications isolated from email and audit traffic. */
    @Bean
    Queue inAppQueue() {
        return QueueBuilder.durable(INAPP_QUEUE).build();
    }

    @Bean
    Binding inAppBinding(Queue inAppQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(inAppQueue).to(eventsExchange).with(INAPP_ROUTING_KEY);
    }

    /** The listener's parameter type decides the target class, not the publisher's __TypeId__ header. */
    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
