package com.moonkage.identity.profile.application.port;

import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.shared.CitizenId;

/** Fingerprints an ID number with a secret that never leaves identity-service (NFR-03, D-07). */
public interface IdNumberHasher {

    IdNumberHash hash(CitizenId idNumber);

    /** The version of the secret {@link #hash} uses; stored next to each fingerprint (D-08). */
    int keyVersion();
}
