package com.moonkage.identity.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.identity.account.dto.AccountResponse;
import com.moonkage.identity.kyc.LegalProfileService;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.profile.dto.AccountNameResponse;
import com.moonkage.identity.profile.dto.UpdateProfileRequest;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every resource of an account: {@code /api/accounts/**} for the logged-in user and {@code /internal/accounts/**} for
 * other services (OpenFeign only; the gateway blocks /internal/** from outside).
 */
@RestController
@RequiredArgsConstructor
public class AccountController {

    private final UserProfileService userProfileService;
    private final LegalProfileService legalProfileService;

    @GetMapping("/api/accounts/me")
    public ResponseEntity<ApiResponse<AccountResponse>> getMyAccount(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getMyAccount(currentUser.accountId())));
    }

    /** FR-02: change the display name; 400 when it is blank or longer than 100 characters. */
    @PatchMapping("/api/accounts/me/profile")
    public ResponseEntity<ApiResponse<AccountResponse>> updateMyProfile(
            @CurrentUser CurrentUserInfo currentUser, @RequestBody @Valid UpdateProfileRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(userProfileService.updateFullName(currentUser.accountId(), request.fullName())));
    }

    /** The name an account shows, for other services (order-service chat). 404 USER_PROFILE_NOT_FOUND. */
    @Hidden
    @GetMapping("/internal/accounts/{accountId}/name")
    public ResponseEntity<AccountNameResponse> getName(@PathVariable String accountId) {
        return ResponseEntity.ok(new AccountNameResponse(accountId, userProfileService.getFullName(accountId)));
    }

    /**
     * vendor-service hashes a declared ID number here instead of holding the pepper itself (D-07, BR-27). The body
     * holds a full ID number: do not log it. 400 ID_NUMBER_INVALID unless 12 digits, 404 when the account is unknown.
     */
    @Hidden
    @PostMapping("/internal/accounts/check")
    public ResponseEntity<CheckIdNumberResponse> checkIdNumber(@RequestBody @Valid CheckIdNumberRequest request) {
        return ResponseEntity.ok(legalProfileService.checkIdNumber(request));
    }
}
