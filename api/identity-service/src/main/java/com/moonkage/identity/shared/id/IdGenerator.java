package com.moonkage.identity.shared.id;

import java.util.UUID;

/**
 * Makes the id of a new entity or event when it is created, not when it is saved (plan v2, 5.5). Production uses UUID
 * v7 (time-ordered); tests use a fixed sequence. Secrets such as NFC session ids never come from here.
 */
public interface IdGenerator {

    UUID next();
}
