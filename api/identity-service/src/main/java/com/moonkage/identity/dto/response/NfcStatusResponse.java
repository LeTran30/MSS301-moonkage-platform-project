package com.moonkage.identity.dto.response;

import com.moonkage.identity.enums.NfcStatus;
import java.time.Instant;

/** GET /internal/accounts/{accountId}/nfc-status, for BR-23 and AC-45.1. Masked data only. */
public record NfcStatusResponse(NfcStatus nfcStatus, String legalName, String idNumberMasked, Instant nfcVerifiedAt) {}
