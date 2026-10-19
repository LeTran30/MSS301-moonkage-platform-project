package com.moonkage.identity.nfc;

import com.moonkage.identity.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.dto.response.NfcStatusResponse;

/** NFC result for other services (Software Design 4.2, 5.3). The pepper never leaves identity-service (D-07). */
public interface LegalProfileService {

    /** BR-23, AC-45.1. Throws ACCOUNT_NOT_FOUND. */
    NfcStatusResponse getNfcStatus(String accountId);

    /** BR-27, AC-26.6, AC-26.8. Throws ID_NUMBER_INVALID unless the number has exactly 12 digits. */
    CheckIdNumberResponse checkIdNumber(CheckIdNumberRequest request);
}
