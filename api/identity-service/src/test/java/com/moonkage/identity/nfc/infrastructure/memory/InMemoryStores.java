package com.moonkage.identity.nfc.infrastructure.memory;

import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.application.port.NfcSessionStore;

/** The real in-memory stores, for use case tests in other packages. */
public final class InMemoryStores {

    private InMemoryStores() {}

    public static NfcSessionStore sessions() {
        return new InMemoryNfcSessionStore();
    }

    public static NfcAttemptStore attempts() {
        return new InMemoryNfcAttemptStore();
    }
}
