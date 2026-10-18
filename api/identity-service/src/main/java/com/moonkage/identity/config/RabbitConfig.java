package com.moonkage.identity.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Domain events go to one topic exchange; routing key = "<kind>.<source service>". */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";
    public static final String EMAIL_ROUTING_KEY = "notification.email.identity";

    // FR-04 (Software Design 5.4): web push and audit, consumed by notification-service
    public static final String NFC_VERIFIED_ROUTING_KEY = "account.nfc_verified";
    public static final String NFC_FAILED_ROUTING_KEY = "account.nfc_failed";
    public static final String NFC_LOCKED_ROUTING_KEY = "account.nfc_locked";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
