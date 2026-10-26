package com.moonkage.quotation.service;

import com.moonkage.quotation.dto.request.AcceptQuoteRequest;
import com.moonkage.quotation.dto.response.AcceptQuoteResponse;
import com.moonkage.quotation.dto.response.AcceptanceResponse;
import java.time.Instant;

/** Accepting a quote, its binding copy and the deposit (FR-19, BR-04, BR-17, L-10). */
public interface QuoteAcceptanceService {

    AcceptQuoteResponse accept(String accountId, String requestId, String quoteId, AcceptQuoteRequest request);

    AcceptanceResponse getAcceptance(String accountId, String role, String requestId, String quoteId);

    /**
     * payment.succeeded with purpose DEPOSIT. Safe to repeat. A deposit that arrives after the acceptance expired,
     * or after another quote of the request won, is refunded (QUOTE_EXPIRED) instead.
     */
    void recordDepositPaid(String acceptanceId, Instant paidAt);

    /** payment.failed with purpose DEPOSIT: the quote unlocks and the buyer may accept again. */
    void recordDepositFailed(String acceptanceId);

    /** Acceptances whose deposit was not paid in time become EXPIRED; returns how many. */
    int expireOverdue();
}
