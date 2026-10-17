package com.moonkage.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Domain events go to one topic exchange; routing key = "<kind>.<source service>". */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";
    public static final String AUDIT_QUEUE = "notification.audit";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
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

    /** The listener's parameter type decides the target class, not the publisher's __TypeId__ header. */
    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
