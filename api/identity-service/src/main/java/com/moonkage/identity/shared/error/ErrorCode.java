package com.moonkage.identity.shared.error;

/**
 * A business error the API can answer with. Each module declares its own codes in a {@code <Module>Error} enum; the
 * codes and message keys are part of the external contract and never change.
 */
public interface ErrorCode {

    /** Stable code clients read, e.g. {@code AUTH_007}. */
    String code();

    /** HTTP status of the answer, e.g. 409. */
    int httpStatus();

    /** Key in {@code messages*.properties}. */
    String messageKey();
}
