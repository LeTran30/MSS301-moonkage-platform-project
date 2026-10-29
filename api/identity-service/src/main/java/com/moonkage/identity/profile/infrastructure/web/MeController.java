package com.moonkage.identity.profile.infrastructure.web;

import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import com.moonkage.identity.profile.application.GetMyAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The logged-in person's own account and profile. */
@RestController
@RequiredArgsConstructor
class MeController {

    private final GetMyAccount getMyAccount;

    @GetMapping("/api/accounts/me")
    ResponseEntity<ApiResponse<MyAccountResponse>> getMyAccount(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(MyAccountResponse.from(getMyAccount.handle(currentUser.accountId()))));
    }
}
