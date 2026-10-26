package com.moonkage.quotation.scheduler;

import com.moonkage.quotation.service.QuoteAcceptanceService;
import com.moonkage.quotation.service.QuoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Unpaid acceptances expire first, which unlocks their quotes; then quotes past their validity expire (AC-17.3).
 * Reads still treat a quote past validUntil as not acceptable before this runs.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QuoteExpiryJob {

    private final QuoteAcceptanceService quoteAcceptanceService;
    private final QuoteService quoteService;

    @Scheduled(fixedDelayString = "${moonkage.quotation.expiry-check-interval:PT1M}")
    public void expireOverdue() {
        int acceptances = quoteAcceptanceService.expireOverdue();
        int quotes = quoteService.expireOverdue();
        if (acceptances > 0 || quotes > 0) {
            log.info("Expired {} unpaid acceptances and {} quotes", acceptances, quotes);
        }
    }
}
