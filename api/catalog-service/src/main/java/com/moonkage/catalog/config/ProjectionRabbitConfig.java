package com.moonkage.catalog.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarable;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("!legacy-writer")
@ConditionalOnProperty(
        prefix = "catalog.projections",
        name = "capture-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class ProjectionRabbitConfig {
    public static final String INBOX_QUEUE = "catalog.projections";
    public static final String DEAD_LETTER_EXCHANGE = "catalog.projections.dlx";
    public static final String DEAD_LETTER_QUEUE = "catalog.projections.dlq";

    @Bean
    Declarables projectionTopology() {
        Queue inbox = QueueBuilder.durable(INBOX_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "rejected")
                .build();
        Queue deadLetters = QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
        TopicExchange exchange = new TopicExchange(RabbitConfig.EVENTS_EXCHANGE, true, false);
        TopicExchange deadLetterExchange = new TopicExchange(DEAD_LETTER_EXCHANGE, true, false);
        List<Declarable> topology = new ArrayList<>(List.of(
                inbox,
                deadLetters,
                exchange,
                deadLetterExchange,
                BindingBuilder.bind(deadLetters).to(deadLetterExchange).with("rejected")));
        for (String routingKey :
                List.of("product.upserted", "product.removed", "vendor.updated", "vendor.locked", "review.created")) {
            topology.add(BindingBuilder.bind(inbox).to(exchange).with(routingKey));
        }
        return new Declarables(topology);
    }
}
