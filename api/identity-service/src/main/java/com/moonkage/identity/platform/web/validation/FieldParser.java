package com.moonkage.identity.platform.web.validation;

import com.moonkage.identity.shared.value.ValueRejected;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Parses the fields of one request into value objects and collects every refusal, so a 400 lists all bad fields at
 * once like Bean Validation did (plan v2, 6.2). Use one instance per request: parse every field, then call
 * {@link #throwIfRejected()} once.
 *
 * <p>The message key of a refusal is {@code <keyPrefix>.<suffix>}, the suffix following the {@link ValueRejected}
 * reason; a field whose existing key breaks that pattern passes overrides.
 */
public final class FieldParser {

    private final List<FieldRejection> rejections = new ArrayList<>();

    /**
     * A required field.
     *
     * @param field the JSON field name, as clients send it
     * @param keyPrefix e.g. {@code validation.address.recipient_phone}
     * @return the value, or null when refused (then {@link #throwIfRejected()} throws)
     */
    public <T> T required(String field, String keyPrefix, String raw, Function<String, T> parse) {
        return required(field, keyPrefix, Map.of(), raw, parse);
    }

    /** A required field whose message keys do not all follow {@code <keyPrefix>.<suffix>}. */
    public <T> T required(
            String field,
            String keyPrefix,
            Map<ValueRejected.Reason, String> keyOverrides,
            String raw,
            Function<String, T> parse) {
        try {
            return parse.apply(raw);
        } catch (ValueRejected e) {
            rejections.add(new FieldRejection(field, keyPrefix, Map.copyOf(keyOverrides), e));
            return null;
        }
    }

    /** An optional field: null or only spaces means "not given" and comes back as null without parsing. */
    public <T> T optional(String field, String keyPrefix, String raw, Function<String, T> parse) {
        return raw == null || raw.isBlank() ? null : required(field, keyPrefix, raw, parse);
    }

    /** Call after every field is parsed. */
    public void throwIfRejected() {
        if (!rejections.isEmpty()) {
            throw new InvalidFields(rejections);
        }
    }

    /** One refused field and what is needed to tell the client why. */
    public record FieldRejection(
            String field, String keyPrefix, Map<ValueRejected.Reason, String> keyOverrides, ValueRejected cause) {

        private static final Map<ValueRejected.Reason, String> SUFFIX = Map.of(
                ValueRejected.Reason.REQUIRED, "required",
                ValueRejected.Reason.BAD_FORMAT, "invalid",
                ValueRejected.Reason.UNKNOWN_CODE, "invalid",
                ValueRejected.Reason.TOO_LONG, "too_long",
                ValueRejected.Reason.TOO_SHORT, "too_short");

        /** The override for this reason, else {@code <keyPrefix>.<suffix>}. */
        public String messageKey() {
            String override = keyOverrides.get(cause.reason());
            return override != null ? override : keyPrefix + "." + SUFFIX.get(cause.reason());
        }
    }
}
