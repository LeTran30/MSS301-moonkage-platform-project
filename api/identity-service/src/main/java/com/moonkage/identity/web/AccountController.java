package com.moonkage.identity.web;

import com.moonkage.identity.account.dto.AccountResponse;
import com.moonkage.identity.kyc.LegalProfileService;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
import com.moonkage.identity.kyc.dto.response.CheckIdNumberResponse;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import com.moonkage.identity.profile.UserProfileService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
