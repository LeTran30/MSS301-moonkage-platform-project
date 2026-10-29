package com.moonkage.identity.kyc.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.kyc.application.port.IdNumberHasher;
import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.MaskedIdNumber;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * BR-27: vendor-service hashes the ID number a seller declared here, so the pepper never leaves identity-service
 * (D-07), and learns whether it is the number on the owner's verified card.
 */
@Service
@RequiredArgsConstructor
public class CheckIdNumber {

    private final AccountApi accountApi;
    private final ProfileApi profileApi;
    private final IdNumberHasher hasher;

    /** Throws NOT_FOUND of the account. */
    public IdNumberCheck handle(AccountId accountId, CitizenId declared) {
        if (accountApi.find(accountId).isEmpty()) {
            throw new AppException(AccountError.NOT_FOUND, accountId.toString());
        }
        IdNumberHash hash = hasher.hash(declared);
        int keyVersion = hasher.keyVersion();
        LegalIdentity owner = profileApi.findKyc(accountId).orElse(null);
        boolean matches = owner != null && owner.matches(hash, keyVersion);
        return new IdNumberCheck(hash, keyVersion, declared.masked(), matches, owner);
    }

    /**
     * A declared number, fingerprinted, next to the owner's verified card.
     *
     * @param owner what the owner's card proved; null when the owner has not passed KYC
     */
    public record IdNumberCheck(
            IdNumberHash hash, int keyVersion, MaskedIdNumber masked, boolean matchesAccount, LegalIdentity owner) {}
}
