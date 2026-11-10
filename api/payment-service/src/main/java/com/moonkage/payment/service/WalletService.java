package com.moonkage.payment.service;

import com.moonkage.payment.dto.response.WalletResponse;
import com.moonkage.payment.enums.WalletEntryReason;

/**
 * The buyer's wallet (Q-01). Every write runs in the caller's transaction, locks the wallet row and adds its
 * wallet_entries row, so the database can check the balance against its entries at commit.
 */
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

    /** Money into the wallet, opening it on first use; nothing when (reason, reference) was already credited. */
    void credit(String accountId, WalletEntryReason reason, long amount, String referenceId);

    /** Money out of the wallet; WALLET_001 when the balance is short. */
    void debit(String accountId, WalletEntryReason reason, long amount, String referenceId);

    /** What the platform owes all buyers together, for the admin. */
    long totalBalance();
}
