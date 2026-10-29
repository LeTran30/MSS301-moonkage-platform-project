package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.fail;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

/**
 * Every message identity-service publishes on {@code moonkage.events}, read back from a queue bound to {@code #}, as
 * orchestrator-service would receive it. Shared by all contract tests of one run.
 */
final class EventInbox {

    static final String EXCHANGE = "moonkage.events";
    private static final String QUEUE = "contract.inbox";
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final Duration POLL = Duration.ofMillis(50);

    /** One received message. */
    record Event(String routingKey, String contentType, String body) {}

    private final RabbitTemplate rabbitTemplate;
    private final List<Event> received = new ArrayList<>();

    EventInbox(RabbitTemplate rabbitTemplate, AmqpAdmin amqpAdmin) {
        this.rabbitTemplate = rabbitTemplate;
        Queue queue = new Queue(QUEUE, false, false, true);
        amqpAdmin.declareQueue(queue);
        Binding binding =
                BindingBuilder.bind(queue).to(new TopicExchange(EXCHANGE)).with("#");
        amqpAdmin.declareBinding(binding);
    }

    /** Waits for the last message matching {@code test}: outbox events are relayed a moment after the request. */
    synchronized Event awaitLast(Predicate<Event> test, String what) {
        Instant deadline = Instant.now().plus(WAIT);
        while (Instant.now().isBefore(deadline)) {
            drain();
            Optional<Event> found = received.reversed().stream().filter(test).findFirst();
            if (found.isPresent()) {
                return found.get();
            }
            pause();
        }
        return fail("no event " + what + " within " + WAIT);
    }

    /** Messages received so far that match; nothing waits, for "nothing was published" checks after a wait. */
    synchronized List<Event> all(Predicate<Event> test) {
        drain();
        return received.stream().filter(test).toList();
    }

    private void drain() {
        Message message;
        while ((message = rabbitTemplate.receive(QUEUE)) != null) {
            received.add(new Event(
                    message.getMessageProperties().getReceivedRoutingKey(),
                    message.getMessageProperties().getContentType(),
                    new String(message.getBody(), StandardCharsets.UTF_8)));
        }
    }

    private static void pause() {
        try {
            Thread.sleep(POLL.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
