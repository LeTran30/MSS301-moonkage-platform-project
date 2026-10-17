package com.moonkage.catalog.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Domain events go to one topic exchange; routing key = "<kind>.<source service>". */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";
    public static final String AUDIT_ROUTING_KEY = "audit.catalog";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
