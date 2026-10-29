package com.moonkage.identity.kyc.application.port;

import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.profile.IdNumberHash;

/** Fingerprints an ID number with a secret that never leaves identity-service (NFR-03, D-07). */
public interface IdNumberHasher {

    IdNumberHash hash(CitizenId idNumber);

    /** The version of the secret {@link #hash} uses; stored next to each fingerprint (D-08). */
    int keyVersion();
}
