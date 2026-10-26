package com.moonkage.vendor.product;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Gives back the stock of checkouts that were neither paid nor released in time (BR-28, P-01): order-service sets
 * the expiry, and its own release may never come. One transaction per checkout, so one failure stops nothing else.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class ExpiredReservationSweeper {

    private final StockService stockService;
    private final StockProperties properties;

    @Scheduled(fixedDelayString = "${vendor.stock.sweep-interval}")
    void sweep() {
        Instant now = Instant.now();
        for (String checkoutId : stockService.findExpiredCheckouts(now, properties.sweepBatchSize())) {
            try {
                stockService.releaseIfExpired(checkoutId, now);
            } catch (DataAccessException e) {
                log.warn("Expired hold of checkout {} not released, retried next run: {}", checkoutId, e.getMessage());
            }
        }
    }
}
