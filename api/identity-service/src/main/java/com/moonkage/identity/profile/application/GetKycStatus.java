package com.moonkage.identity.profile.application;

import com.moonkage.identity.nfc.NfcApi;
import com.moonkage.identity.profile.ProfileKyc;
import com.moonkage.identity.shared.AccountId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Whether a profile passed KYC, for itself and for other services (BR-23, AC-45.1). Masked data only. */
@Service
@RequiredArgsConstructor
class GetKycStatus {

    private final ProfileQueries queries;
    private final NfcApi nfcApi;

    ProfileKyc handle(AccountId id) {
        return queries.findKyc(id)
                .map(card -> ProfileKyc.verified(card.legalName(), card.idNumberMasked()))
                .orElseGet(() -> ProfileKyc.unverified(nfcApi.isLocked(id)));
    }
}
