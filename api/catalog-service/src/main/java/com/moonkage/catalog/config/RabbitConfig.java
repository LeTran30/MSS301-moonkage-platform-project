package com.moonkage.catalog.config;

import com.moonkage.outbox.EventExchange;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Domain events go to one topic exchange; routing key = "<kind>.<source service>". */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = EventExchange.NAME;

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
