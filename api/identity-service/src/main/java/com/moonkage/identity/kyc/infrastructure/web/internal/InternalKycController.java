package com.moonkage.identity.kyc.infrastructure.web.internal;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.kyc.KycError;
import com.moonkage.identity.kyc.application.CheckIdNumber;
import com.moonkage.identity.kyc.application.GetKycStatus;
import com.moonkage.identity.kyc.domain.CitizenId;
import com.moonkage.identity.kyc.infrastructure.web.KycStatusResponse;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.value.ValueRejected;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * KYC for other services (vendor-service, quotation-service), unwrapped. OpenFeign only: the gateway blocks
 * /internal/** from outside.
 */
@Hidden
@RestController
@RequiredArgsConstructor
class InternalKycController {

    private final GetKycStatus getKycStatus;
    private final CheckIdNumber checkIdNumber;

    /** BR-23, AC-45.1. Masked data only; 404 when the account is unknown, also for an id that is no UUID. */
    @GetMapping("/internal/nfc/status/{accountId}")
    ResponseEntity<KycStatusResponse> getStatus(@PathVariable String accountId) {
        return ResponseEntity.ok(KycStatusResponse.from(getKycStatus.handle(accountIdOf(accountId))));
    }

    /**
     * BR-27: the body holds a full ID number, do not log it. 400 ID_NUMBER_INVALID unless 12 digits remain once the
     * separators are dropped, then 404 when the account is unknown.
     */
    @PostMapping("/internal/accounts/check")
    ResponseEntity<CheckIdNumberResponse> checkIdNumber(@RequestBody @Valid CheckIdNumberRequest request) {
        CitizenId declared = declaredNumber(request.idNumber());
        return ResponseEntity.ok(
                CheckIdNumberResponse.from(checkIdNumber.handle(accountIdOf(request.accountId()), declared)));
    }

    private static CitizenId declaredNumber(String raw) {
        try {
            return CitizenId.parseDeclared(raw);
        } catch (ValueRejected e) {
            throw new AppException(KycError.ID_NUMBER_INVALID);
        }
    }

    private static AccountId accountIdOf(String raw) {
        return AccountId.tryParse(raw).orElseThrow(() -> new AppException(AccountError.NOT_FOUND, raw));
    }
}
