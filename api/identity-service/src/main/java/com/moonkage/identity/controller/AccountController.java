package com.moonkage.identity.controller;

import com.moonkage.identity.dto.response.ApiResponse;
import com.moonkage.identity.dto.response.LoginResponse;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import com.moonkage.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyProfile(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getMyProfile(currentUser.accountId())));
    }
}
