package com.moonkage.payment.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.payment.dto.response.WalletResponse;
import com.moonkage.payment.security.CurrentUser;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Root Wallet: the logged-in buyer's own wallet (Q-01). */
@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ApiResponse<WalletResponse> mine(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(walletService.mine(caller.accountId(), page, size));
    }
}
