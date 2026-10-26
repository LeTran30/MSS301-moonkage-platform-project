package com.moonkage.vendor.common.config;

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
 * Domain events go to the one topic exchange every service shares (Software Design 5.4). The routing keys vendor
 * sends are added by the phase that sends them (docs/architecture/api-db/vendor.md, "Sự kiện").
 */
@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "moonkage.events";

    // FR-26, FR-45, consumed by orchestrator-service (notification to the admins / the owner, AC-45.3)
    public static final String VENDOR_SUBMITTED_ROUTING_KEY = "vendor.submitted";
    public static final String VENDOR_REVIEWED_ROUTING_KEY = "vendor.reviewed";

    // full vendor snapshot (VendorSnapshot in an EventEnvelope), consumed by catalog, quotation, order and
    // orchestrator-service
    public static final String VENDOR_UPDATED_ROUTING_KEY = "vendor.updated";
    public static final String VENDOR_LOCKED_ROUTING_KEY = "vendor.locked";

    // product of a Shop (ProductSnapshot in an EventEnvelope), consumed by catalog-service (L-18); removed is final
    public static final String PRODUCT_UPSERTED_ROUTING_KEY = "product.upserted";
    public static final String PRODUCT_REMOVED_ROUTING_KEY = "product.removed";

    // FR-53, BR-31, consumed by orchestrator-service (notification and audit)
    public static final String VENDOR_REGISTRATION_FEE_PAID_ROUTING_KEY = "vendor.registration_fee_paid";
    public static final String REGISTRATION_FEE_CHANGED_ROUTING_KEY = "registration_fee.changed";

    // sent by payment-service; vendor-service records the registration fee (BR-31)
    public static final String PAYMENT_SUCCEEDED_ROUTING_KEY = "payment.succeeded";

    /** Durable: a payment that succeeds while vendor-service is down is recorded once it is back (AC-27.5). */
    public static final String PAYMENT_EVENTS_QUEUE = "vendor-service.payment-events";

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    Queue paymentEventsQueue() {
        return QueueBuilder.durable(PAYMENT_EVENTS_QUEUE).build();
    }

    @Bean
    Binding paymentSucceededBinding(Queue paymentEventsQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(paymentEventsQueue).to(eventsExchange).with(PAYMENT_SUCCEEDED_ROUTING_KEY);
    }

    /** The listener's parameter type decides the target class, not the publisher's __TypeId__ header. */
    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
