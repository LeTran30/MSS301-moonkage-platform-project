package com.moonkage.quotation.enums;

/** Deposit payment of an accepted quote (FR-19). Only SUCCEEDED makes the quote ACCEPTED (BR-04). */
public enum AcceptanceStatus {
    PENDING_PAYMENT,
    SUCCEEDED,
    FAILED,
    EXPIRED
}
