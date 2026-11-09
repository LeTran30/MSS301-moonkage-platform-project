package com.moonkage.catalog.service.replay;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.entity.projection.InboxEntry;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Reads the stored payload of an inbox event strictly (docs/services/catalog/contract-proposal.md): a field the
 * contract requires must be present with its JSON type, a nullable field must be present (full snapshot), nothing is
 * guessed. Every failure is an {@link IllegalArgumentException}, so the event stays pending for investigation.
 */
@Component
public class ProjectionEventReader {
    static final int SCHEMA_VERSION = 1;

    private final ObjectMapper objectMapper;

    public ProjectionEventReader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** The envelope v1 of a state event (§2): schema, type and aggregate checked against what the inbox stored. */
    public Envelope readEnvelope(InboxEntry event, String aggregateType) {
        JsonNode root = readTree(event.payload());
        if (requireLong(root, "schemaVersion") != SCHEMA_VERSION) {
            throw new IllegalArgumentException("Unsupported schemaVersion");
        }
        if (!event.routingKey().equals(requireText(root, "eventType"))) {
            throw new IllegalArgumentException("eventType differs from the received routing key");
        }
        if (!aggregateType.equals(requireText(root, "aggregateType"))) {
            throw new IllegalArgumentException("Unexpected aggregateType");
        }
        long sourceVersion = requireLong(root, "sourceVersion");
        if (sourceVersion < 0) {
            throw new IllegalArgumentException("sourceVersion must be non-negative");
        }
        JsonNode data = root.get("data");
        if (data == null || !data.isObject()) {
            throw new IllegalArgumentException("data must be an object");
        }
        return new Envelope(requireText(root, "aggregateId"), sourceVersion, data);
    }

    public String requireText(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new IllegalArgumentException("Missing or blank " + field);
        }
        return value.asText();
    }

    public String nullableText(JsonNode node, String field) {
        JsonNode value = requirePresent(node, field);
        if (value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            throw new IllegalArgumentException(field + " must be a string or null");
        }
        return value.asText();
    }

    /**
     * A string that may be missing altogether, not only null.
     *
     * <p>For a field added to the contract after the first snapshots were written: a snapshot published before the
     * field existed has no such key at all, and refusing it would keep those events pending for ever. A field that is
     * there but is neither a string nor null is still a broken contract and is refused.
     */
    public String optionalText(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            throw new IllegalArgumentException(field + " must be a string or null");
        }
        return value.asText();
    }

    public long requireLong(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isIntegralNumber() || !value.canConvertToLong()) {
            throw new IllegalArgumentException("Missing or non-integer " + field);
        }
        return value.asLong();
    }

    public int requireInt(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isIntegralNumber() || !value.canConvertToInt()) {
            throw new IllegalArgumentException("Missing or non-integer " + field);
        }
        return value.asInt();
    }

    public Integer nullableInt(JsonNode node, String field) {
        JsonNode value = requirePresent(node, field);
        return value.isNull() ? null : requireInt(node, field);
    }

    public Long nullableLong(JsonNode node, String field) {
        JsonNode value = requirePresent(node, field);
        return value.isNull() ? null : requireLong(node, field);
    }

    public boolean requireBoolean(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isBoolean()) {
            throw new IllegalArgumentException("Missing or non-boolean " + field);
        }
        return value.asBoolean();
    }

    public List<String> requireTextList(JsonNode node, String field) {
        JsonNode array = requireArray(node, field);
        List<String> values = new ArrayList<>(array.size());
        for (JsonNode item : array) {
            if (!item.isTextual() || item.asText().isBlank()) {
                throw new IllegalArgumentException(field + " must hold non-blank strings");
            }
            values.add(item.asText());
        }
        return values;
    }

    public JsonNode requireArray(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isArray()) {
            throw new IllegalArgumentException("Missing array " + field);
        }
        return value;
    }

    public LocalDate requireDate(JsonNode node, String field) {
        try {
            return LocalDate.parse(requireText(node, field));
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException(field + " must be an ISO local date", exception);
        }
    }

    public Instant requireInstant(JsonNode node, String field) {
        try {
            return Instant.parse(requireText(node, field));
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException(field + " must be an ISO instant", exception);
        }
    }

    public <E extends Enum<E>> E requireEnum(JsonNode node, String field, Class<E> type) {
        String value = requireText(node, field);
        try {
            return Enum.valueOf(type, value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown " + field, exception);
        }
    }

    /** data.idField must name the aggregate of the envelope. */
    public String requireAggregateId(Envelope envelope, String idField) {
        String id = requireText(envelope.data(), idField);
        if (!id.equals(envelope.aggregateId())) {
            throw new IllegalArgumentException(idField + " differs from aggregateId");
        }
        return id;
    }

    private JsonNode requirePresent(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null) {
            throw new IllegalArgumentException("Missing field " + field);
        }
        return value;
    }

    private JsonNode readTree(String payload) {
        try {
            JsonNode root = objectMapper
                    .reader()
                    .with(JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
                    .with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .readTree(payload);
            if (root == null || !root.isObject()) {
                throw new IllegalArgumentException("Payload must be a JSON object");
            }
            return root;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Malformed stored payload", exception);
        }
    }

    /** What every state event carries besides eventId; data is the snapshot or signal of its type. */
    public record Envelope(String aggregateId, long sourceVersion, JsonNode data) {}
}
