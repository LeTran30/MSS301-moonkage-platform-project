package com.moonkage.identity.platform.messaging.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.identity.shared.id.IdGenerator;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Records an event inside the current transaction (Software Design 6); {@link OutboxRelay} sends it later. */
@Component
@RequiredArgsConstructor
public class Outbox {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final IdGenerator idGenerator;

    /**
     * MANDATORY: an event written outside the business transaction would defeat the outbox.
     *
     * @param routingKey routing key on the {@code moonkage.events} exchange
     * @param event builds the event around its new id, which the payload must carry; serialized to JSON as is
     * @return the id given to the event
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public EventId enqueue(String routingKey, Function<EventId, ?> event) {
        EventId id = new EventId(idGenerator.next());
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event.apply(id));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Event " + id + " cannot be serialized", e);
        }
        outboxEventRepository.add(OutboxEvent.record(id, routingKey, payload));
        return id;
    }
}
