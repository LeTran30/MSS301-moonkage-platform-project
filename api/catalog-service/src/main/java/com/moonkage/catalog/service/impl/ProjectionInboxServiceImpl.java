package com.moonkage.catalog.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.entity.projection.InboxEntry;
import com.moonkage.catalog.repository.ProjectionInboxRepository;
import com.moonkage.catalog.service.ProjectionInboxService;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectionInboxServiceImpl implements ProjectionInboxService {
    private static final int MAX_EVENT_ID_LENGTH = 64;
    private static final int MAX_BATCH_SIZE = 1000;
    private static final Set<String> ROUTING_KEYS =
            Set.of("product.upserted", "product.removed", "vendor.updated", "vendor.locked", "review.created");
    private final ProjectionInboxRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public boolean capture(String routingKey, byte[] payload) {
        if (routingKey == null || !ROUTING_KEYS.contains(routingKey) || payload == null) {
            throw new IllegalArgumentException("Unsupported inbox message");
        }
        JsonNode json = parse(payload);
        JsonNode identity = json == null ? null : json.get("eventId");
        if (identity == null
                || !identity.isTextual()
                || identity.asText().isBlank()
                || identity.asText().length() > MAX_EVENT_ID_LENGTH) {
            throw new IllegalArgumentException("Missing or invalid eventId");
        }
        // Only the approved envelope minimum is read. No guessed field names or snapshot/patch interpretation.
        return repository.capture(identity.asText(), routingKey, json.toString());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InboxEntry> findPending(int limit) {
        if (limit < 1 || limit > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("Invalid inbox batch size");
        }
        return List.copyOf(repository.findPending(limit));
    }

    private JsonNode parse(byte[] payload) {
        try {
            return objectMapper
                    .reader()
                    .with(com.fasterxml.jackson.core.JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
                    .with(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .readTree(payload);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Malformed inbox JSON", exception);
        }
    }
}
