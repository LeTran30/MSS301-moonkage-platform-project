package com.moonkage.identity.shared.value;

import java.util.Map;

/**
 * Input a value object refused to take (plan v2, 5.4). It says only why: not the field, not the message key, not the
 * HTTP status. {@code FieldParser} adds those, because only the web layer knows the context. Not a bug, so no stack
 * trace is captured.
 */
public final class ValueRejected extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** Argument name of {@link #tooLong} in messages, e.g. {@code {max}}. */
    public static final String MAX = "max";

    /** Argument name of {@link #tooShort} in messages, e.g. {@code {min}}. */
    public static final String MIN = "min";

    /** Why the input was refused. */
    public enum Reason {
        REQUIRED,
        TOO_SHORT,
        TOO_LONG,
        BAD_FORMAT,
        UNKNOWN_CODE
    }

    private final Reason reason;

    @SuppressWarnings("serial")
    private final Map<String, Object> args;

    private ValueRejected(Reason reason, Map<String, Object> args) {
        super(reason.name(), null, false, false);
        this.reason = reason;
        this.args = Map.copyOf(args);
    }

    public static ValueRejected required() {
        return new ValueRejected(Reason.REQUIRED, Map.of());
    }

    public static ValueRejected badFormat() {
        return new ValueRejected(Reason.BAD_FORMAT, Map.of());
    }

    public static ValueRejected unknownCode() {
        return new ValueRejected(Reason.UNKNOWN_CODE, Map.of());
    }

    public static ValueRejected tooLong(int max) {
        return new ValueRejected(Reason.TOO_LONG, Map.of(MAX, max));
    }

    public static ValueRejected tooShort(int min) {
        return new ValueRejected(Reason.TOO_SHORT, Map.of(MIN, min));
    }

    public Reason reason() {
        return reason;
    }

    /** Named arguments for the message, e.g. {@code {max: 100}}. */
    public Map<String, Object> args() {
        return args;
    }
}
