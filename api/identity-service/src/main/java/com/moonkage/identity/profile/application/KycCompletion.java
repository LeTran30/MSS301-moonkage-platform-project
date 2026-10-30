package com.moonkage.identity.profile.application;

/** What {@link CompleteKyc} did. Both refusals are expected outcomes of a card check, not errors. */
public enum KycCompletion {
    COMPLETED,
    /** The profile already holds a legal identity; nothing changed. */
    ALREADY_COMPLETED,
    /** Another profile holds the same ID number (BR-23); nothing changed. */
    ID_NUMBER_TAKEN
}
