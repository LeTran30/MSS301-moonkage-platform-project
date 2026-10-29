package com.moonkage.identity.kyc.infrastructure.memory;

import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.application.port.NfcSessionStore;

/** The real in-memory stores, for use case tests in other packages. */
public final class InMemoryStores {

    private InMemoryStores() {}

    public static NfcSessionStore sessions() {
        return new InMemoryNfcSessionStore();
    }

    public static KycAttemptStore attempts() {
        return new InMemoryKycAttemptStore();
    }
}
