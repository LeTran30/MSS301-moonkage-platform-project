package com.moonkage.vendor.common.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Domain events go to the one topic exchange every service shares (Software Design 5.4). The routing keys vendor
 * sends are added by the phase that sends them (docs/architecture/api-db/vendor.md, "Sự kiện").
 */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";

    // FR-26, FR-45, consumed by orchestrator-service (notification to the admins / the owner, AC-45.3)
    public static final String VENDOR_SUBMITTED_ROUTING_KEY = "vendor.submitted";
    public static final String VENDOR_REVIEWED_ROUTING_KEY = "vendor.reviewed";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
