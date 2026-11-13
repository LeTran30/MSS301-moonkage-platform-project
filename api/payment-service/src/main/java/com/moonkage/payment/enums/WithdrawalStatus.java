package com.moonkage.payment.enums;

/** withdrawals.status. */
public enum WithdrawalStatus {
    /** Asked; the money already left the wallet and waits for an admin. */
    PENDING,
    /** The admin transferred it to the bank account. */
    COMPLETED,
    /** The admin refused it; the money went back to the wallet. */
    REJECTED
}
