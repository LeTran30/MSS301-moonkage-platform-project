package com.moonkage.identity.profile.application;

import com.moonkage.identity.profile.IdNumberCheck;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.application.port.IdNumberHasher;
import com.moonkage.identity.profile.domain.LegalIdentity;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * BR-27: vendor-service hashes the ID number a seller declared here, so the pepper never leaves identity-service
 * (D-07), and learns whether it is the number on the owner's verified card.
 */
@Service
@RequiredArgsConstructor
class CheckIdNumber {

    private final ProfileQueries queries;
    private final GetKycStatus getKycStatus;
    private final IdNumberHasher hasher;

    IdNumberCheck handle(AccountId id, CitizenId declared) {
        IdNumberHash hash = hasher.hash(declared);
        int keyVersion = hasher.keyVersion();
        Optional<LegalIdentity> card = queries.findKyc(id);
        boolean matches = card.isPresent() && card.get().matches(hash, keyVersion);
        return new IdNumberCheck(hash, keyVersion, declared.masked(), matches, getKycStatus.handle(id));
    }
}
