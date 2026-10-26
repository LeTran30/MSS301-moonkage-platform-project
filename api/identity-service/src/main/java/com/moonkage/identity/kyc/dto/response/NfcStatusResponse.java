package com.moonkage.identity.kyc.dto.response;

import com.moonkage.identity.kyc.NfcStatus;
import java.time.Instant;

/** GET /internal/nfc/status/{accountId}, for BR-23 and AC-45.1. Masked data only. */
public record NfcStatusResponse(NfcStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt) {}
