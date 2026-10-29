package com.moonkage.identity.kyc.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.domain.KycStatus;
import com.moonkage.identity.profile.LegalIdentity;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import java.time.Clock;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Whether an account passed KYC, for itself and for other services (BR-23, AC-45.1). Masked data only. */
@Service
@RequiredArgsConstructor
public class GetKycStatus {

    private final AccountApi accountApi;
    private final ProfileApi profileApi;
    private final KycAttemptStore attempts;
    private final Clock clock;

    /** Throws NOT_FOUND of the account. */
    public AccountKyc handle(AccountId id) {
        if (accountApi.find(id).isEmpty()) {
            throw new AppException(AccountError.NOT_FOUND, id.toString());
        }
        Optional<LegalIdentity> identity = profileApi.findKyc(id);
        if (identity.isPresent()) {
            return new AccountKyc(KycStatus.VERIFIED, identity.get());
        }
        boolean locked = attempts.lockoutOf(id).isLocked(clock.instant());
        return new AccountKyc(locked ? KycStatus.LOCKED : KycStatus.NOT_VERIFIED, null);
    }

    /**
     * The KYC standing of one account.
     *
     * @param identity what the card proved; null unless VERIFIED
     */
    public record AccountKyc(KycStatus status, LegalIdentity identity) {}
}
