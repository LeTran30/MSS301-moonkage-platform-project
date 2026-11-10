package com.moonkage.payment.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.PageResponse;
import com.moonkage.payment.dto.request.CreateWithdrawalRequest;
import com.moonkage.payment.dto.request.ReviewWithdrawalRequest;
import com.moonkage.payment.dto.response.BankResponse;
import com.moonkage.payment.dto.response.WalletResponse;
import com.moonkage.payment.dto.response.WalletSummaryResponse;
import com.moonkage.payment.dto.response.WithdrawalResponse;
import com.moonkage.payment.enums.WithdrawalStatus;
import com.moonkage.payment.gateway.VietQrBankDirectory;
import com.moonkage.payment.security.CurrentUser;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.WalletService;
import com.moonkage.payment.service.WithdrawalService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Root Wallet (Q-01): the buyer's own wallet and withdrawals; the admin's overview and withdrawal queue. */
@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final WithdrawalService withdrawalService;
    private final VietQrBankDirectory bankDirectory;

    @GetMapping("/me")
    public ApiResponse<WalletResponse> mine(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(walletService.mine(caller.accountId(), page, size));
    }

    /** The banks a withdrawal can go to (VietQR list, kept a day). */
    @GetMapping("/banks")
    public ApiResponse<List<BankResponse>> banks() {
        return ApiResponse.ok(bankDirectory.banks());
    }

    @GetMapping("/me/withdrawals")
    public ApiResponse<List<WithdrawalResponse>> myWithdrawals(@CurrentUser CurrentUserInfo caller) {
        return ApiResponse.ok(withdrawalService.mine(caller.accountId()));
    }

    /** The money leaves the wallet at once; 409 WALLET_001 when the balance is short. */
    @PostMapping("/me/withdrawals")
    public ApiResponse<WithdrawalResponse> requestWithdrawal(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody CreateWithdrawalRequest request) {
        return ApiResponse.ok(withdrawalService.request(caller.accountId(), request));
    }

    /** Admin: the withdrawals by status, oldest first (the queue to transfer). */
    @GetMapping("/withdrawals")
    public ApiResponse<PageResponse<WithdrawalResponse>> withdrawals(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(defaultValue = "PENDING") WithdrawalStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(withdrawalService.list(caller, status, page, size));
    }

    /** Admin: COMPLETED once transferred, or REJECTED with a reason. */
    @PatchMapping("/withdrawals/{withdrawalId}")
    public ApiResponse<WithdrawalResponse> reviewWithdrawal(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String withdrawalId,
            @Valid @RequestBody ReviewWithdrawalRequest request) {
        return ApiResponse.ok(withdrawalService.review(caller, withdrawalId, request));
    }

    /** Admin: what buyers hold in their wallets and the withdrawals still to transfer. */
    @GetMapping("/summary")
    public ApiResponse<WalletSummaryResponse> summary(@CurrentUser CurrentUserInfo caller) {
        return ApiResponse.ok(withdrawalService.summary(caller));
    }
}
