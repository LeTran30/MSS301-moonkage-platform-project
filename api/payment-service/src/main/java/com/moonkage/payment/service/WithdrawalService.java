package com.moonkage.payment.service;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.dto.request.CreateWithdrawalRequest;
import com.moonkage.payment.dto.request.ReviewWithdrawalRequest;
import com.moonkage.payment.dto.response.WalletSummaryResponse;
import com.moonkage.payment.dto.response.WithdrawalResponse;
import com.moonkage.payment.enums.WithdrawalStatus;
import com.moonkage.payment.security.CurrentUserInfo;
import java.util.List;

/** Wallet money to a bank account (Q-01): the buyer asks, an admin transfers by hand and closes the request. */
public interface WithdrawalService {

    /** The money leaves the wallet at once; WALLET_001 when the balance is short. */
    WithdrawalResponse request(String accountId, CreateWithdrawalRequest request);

    List<WithdrawalResponse> mine(String accountId);

    /** Admin only. */
    PageResponse<WithdrawalResponse> list(CurrentUserInfo caller, WithdrawalStatus status, int page, int size);

    /** Admin only; a PENDING request becomes COMPLETED, or REJECTED with its money back in the wallet. */
    WithdrawalResponse review(CurrentUserInfo caller, String withdrawalId, ReviewWithdrawalRequest request);

    /** Admin only. */
    WalletSummaryResponse summary(CurrentUserInfo caller);
}
