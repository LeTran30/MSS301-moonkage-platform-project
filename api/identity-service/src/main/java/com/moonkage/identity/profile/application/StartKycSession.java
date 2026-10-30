package com.moonkage.identity.profile.application;

import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.nfc.NfcSessionView;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** AC-04.1: the web asks for a QR to start KYC; a profile that already passed has nothing to start. */
@Service
@RequiredArgsConstructor
class StartKycSession {

    private final ProfileQueries queries;
    private final NfcApi nfcApi;

    /** Throws KYC_ALREADY_VERIFIED, or LOCKED with the minutes left. */
    NfcSessionView handle(AccountId owner) {
        if (queries.findKyc(owner).isPresent()) {
            throw new AppException(ProfileError.KYC_ALREADY_VERIFIED);
        }
        return nfcApi.open(owner);
    }
}
