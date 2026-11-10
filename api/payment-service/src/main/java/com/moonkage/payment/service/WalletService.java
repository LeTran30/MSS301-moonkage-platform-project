package com.moonkage.payment.service;

import com.moonkage.payment.dto.response.WalletResponse;

/** The buyer's wallet (Q-01). Writes run in the caller's transaction and lock the wallet row. */
public interface WalletService {

    /** The caller's balance and one page of history; an account that never had money has an empty wallet. */
    WalletResponse mine(String accountId, int page, int size);

    /** Pays {@code paymentId} from the wallet; WALLET_001 when the balance is short. */
    void pay(String accountId, long amount, String paymentId);

    /**
     * A Shop rejected a paid order: what the platform still holds of it goes to the buyer's wallet, once, and the
     * buyer is told. Nothing happens when nothing is held.
     */
    void refundRejectedOrder(String orderId, String buyerAccountId);
}
