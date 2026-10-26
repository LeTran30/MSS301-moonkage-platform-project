package com.moonkage.quotation.service;

import com.moonkage.quotation.dto.request.SubmitQuoteRequest;
import com.moonkage.quotation.dto.request.UpdateQuoteRequest;
import com.moonkage.quotation.dto.response.QuoteResponse;
import java.util.List;

/** Quotes of a request (FR-17, FR-38, BR-05). */
public interface QuoteService {

    /** The latest revision of each vendor's quote; a vendor sees only its own. */
    List<QuoteResponse> getQuotes(String accountId, String role, String requestId);

    QuoteResponse getQuote(String accountId, String role, String requestId, String quoteId, boolean includeRevisions);

    QuoteResponse submit(String accountId, String requestId, SubmitQuoteRequest request);

    QuoteResponse update(String accountId, String requestId, String quoteId, UpdateQuoteRequest request);

    /** Marks quotes past their validity EXPIRED (AC-17.3); returns how many. */
    int expireOverdue();
}
