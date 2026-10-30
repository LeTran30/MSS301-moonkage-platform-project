package com.moonkage.vendor.client;

import com.moonkage.vendor.client.dto.CheckIdNumberRequest;
import com.moonkage.vendor.client.dto.CheckIdNumberResponse;
import com.moonkage.vendor.client.dto.NfcStatusResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Internal API of identity-service (docs/architecture/api-db/vendor.md, "API nội bộ"). Its answers are unwrapped
 * payloads, not ApiResponse. Errors are mapped by {@link IdentityClientConfig}.
 */
@FeignClient(name = "identity-service", path = "/internal", configuration = IdentityClientConfig.class)
public interface IdentityClient {

    /** NFC status of an account, masked data only (BR-23, AC-45.1). 404 → ACCOUNT_NOT_FOUND. */
    @GetMapping("/accounts/{accountId}/profile/kyc")
    NfcStatusResponse getNfcStatus(@PathVariable String accountId);

    /**
     * Hashes an ID number declared on a vendor profile and compares it with the owner's verified card (BR-27, D-07):
     * vendor-service never holds the pepper. 400 → INVALID_INPUT, 404 → ACCOUNT_NOT_FOUND.
     */
    @PostMapping("/accounts/{accountId}/profile/kyc/id-number-check")
    CheckIdNumberResponse checkIdNumber(@PathVariable String accountId, @RequestBody CheckIdNumberRequest request);
}
