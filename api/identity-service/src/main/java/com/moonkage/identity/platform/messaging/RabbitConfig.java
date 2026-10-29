package com.moonkage.identity.platform.messaging;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Events go to one topic exchange; routing key = "<kind>.<source service>". Each module owns its routing keys; this
 * class only knows the exchange and the JSON converter.
 */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
