package com.moonkage.identity.account.infrastructure.web;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.application.CheckAccountIdNumber;
import com.moonkage.identity.account.application.GetAccountKyc;
import com.moonkage.identity.account.application.GetMyAccount;
import com.moonkage.identity.account.infrastructure.web.KycSessionResponses.CardResult;
import com.moonkage.identity.account.infrastructure.web.KycSessionResponses.Created;
import com.moonkage.identity.account.infrastructure.web.KycSessionResponses.Status;
import com.moonkage.identity.address.AddressApi;
import com.moonkage.identity.address.AddressDraft;
import com.moonkage.identity.address.AddressView;
import com.moonkage.identity.nfc.NfcSessionId;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.CitizenId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.value.ValueRejected;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * An account and its resources: the profile with its KYC (FR-04, Software Design 5.1, 7.7) and the address book
 * (FR-03). {@code /api/accounts/me/**} is the logged-in person's own and needs the JWT; {@code /internal/**} is for
 * other services (vendor-service, quotation-service), unwrapped and OpenFeign only: the gateway blocks it from outside.
 *
 * <p>KYC: the web opens an NFC session and shows it as a QR; the Moonkage Verify app, logged in to the same account,
 * sends the card once.
 */
@RestController
@RequiredArgsConstructor
class AccountController {

    private final GetMyAccount getMyAccount;
    private final GetAccountKyc getAccountKyc;
    private final CheckAccountIdNumber checkAccountIdNumber;
    private final ProfileApi profileApi;
    private final AddressApi addressApi;

    @GetMapping("/api/accounts/me")
    ResponseEntity<ApiResponse<MyAccountResponse>> getMyAccount(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(MyAccountResponse.from(getMyAccount.handle(currentUser.accountId()))));
    }

    /** KYC standing of the caller's own account, masked data only. */
    @GetMapping("/api/accounts/me/profile/kyc")
    ResponseEntity<ApiResponse<KycStatusResponse>> getKyc(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(KycStatusResponse.from(getAccountKyc.handle(currentUser.accountId()))));
    }

    /** Web, AC-04.1. */
    @PostMapping("/api/accounts/me/profile/kyc/nfc-sessions")
    ResponseEntity<ApiResponse<Created>> startKycSession(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(Created.from(profileApi.startKyc(currentUser.accountId()))));
    }

    /** Web (fallback when the push is missed) and app (before the tap). 410 expired, 403 not owned. */
    @GetMapping("/api/accounts/me/profile/kyc/nfc-sessions/{sessionId}")
    ResponseEntity<ApiResponse<Status>> getKycSession(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                Status.from(profileApi.findKycSession(new NfcSessionId(sessionId), currentUser.accountId()))));
    }

    /** App, after the user taps Save. 200 also when rejected: see {@code data.status} and {@code data.reasonCode}. */
    @PostMapping("/api/accounts/me/profile/kyc/nfc-sessions/{sessionId}/card")
    ResponseEntity<ApiResponse<CardResult>> submitKycCard(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String sessionId,
            @RequestBody SubmitCardRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(CardResult.from(
                profileApi.submitKycCard(new NfcSessionId(sessionId), currentUser.accountId(), request.toCard()))));
    }

    /** The default first, then the newest. */
    @GetMapping("/api/accounts/me/addresses")
    ResponseEntity<ApiResponse<List<AddressView>>> listAddresses(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(addressApi.list(currentUser.accountId())));
    }

    @PostMapping("/api/accounts/me/addresses")
    ResponseEntity<ApiResponse<AddressView>> addAddress(
            @CurrentUser CurrentUserInfo currentUser, @RequestBody AddressDraft draft) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(addressApi.add(currentUser.accountId(), draft)));
    }

    /** Replaces the whole address; the body is checked before the id. */
    @PutMapping("/api/accounts/me/addresses/{addressId}")
    ResponseEntity<ApiResponse<AddressView>> editAddress(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String addressId, @RequestBody AddressDraft draft) {
        return ResponseEntity.ok(ApiResponse.ok(addressApi.edit(currentUser.accountId(), addressId, draft)));
    }

    /** 204: nothing to wrap. */
    @DeleteMapping("/api/accounts/me/addresses/{addressId}")
    ResponseEntity<Void> removeAddress(@CurrentUser CurrentUserInfo currentUser, @PathVariable String addressId) {
        addressApi.remove(currentUser.accountId(), addressId);
        return ResponseEntity.noContent().build();
    }

    /** BR-23, AC-45.1. Masked data only; 404 when the account is unknown, also for an id that is no UUID. */
    @Hidden
    @GetMapping("/internal/accounts/{accountId}/profile/kyc")
    ResponseEntity<KycStatusResponse> getKycOf(@PathVariable String accountId) {
        return ResponseEntity.ok(KycStatusResponse.from(getAccountKyc.handle(accountIdOf(accountId))));
    }

    /**
     * BR-27: the body holds a full ID number, do not log it. 400 ID_NUMBER_INVALID unless 12 digits remain once the
     * separators are dropped, then 404 when the account is unknown.
     */
    @Hidden
    @PostMapping("/internal/accounts/{accountId}/profile/kyc/id-number-check")
    ResponseEntity<CheckIdNumberResponse> checkIdNumber(
            @PathVariable String accountId, @RequestBody @Valid CheckIdNumberRequest request) {
        CitizenId declared = declaredNumber(request.idNumber());
        return ResponseEntity.ok(
                CheckIdNumberResponse.from(checkAccountIdNumber.handle(accountIdOf(accountId), declared)));
    }

    private static CitizenId declaredNumber(String raw) {
        try {
            return CitizenId.parseDeclared(raw);
        } catch (ValueRejected e) {
            throw new AppException(ProfileError.ID_NUMBER_INVALID);
        }
    }

    private static AccountId accountIdOf(String raw) {
        return AccountId.tryParse(raw).orElseThrow(() -> new AppException(AccountError.NOT_FOUND, raw));
    }
}
