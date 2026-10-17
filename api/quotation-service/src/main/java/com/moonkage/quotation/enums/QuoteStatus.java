package com.moonkage.quotation.enums;

/** 7.1 Quote.status. A sent quote is never edited (BR-05). */
public enum QuoteStatus {
    SUBMITTED,
    WITHDRAWN,
    EXPIRED,
    ACCEPTED,
    CLOSED,
    REJECTED
}
