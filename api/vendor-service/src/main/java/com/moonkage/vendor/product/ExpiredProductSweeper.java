package com.moonkage.vendor.product;

import com.moonkage.vendor.common.TimeConstant;
import java.time.Clock;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Hides legacy or overnight products after their expiry date and announces the new snapshot. */
@Slf4j
@Component
@RequiredArgsConstructor
class ExpiredProductSweeper {

    private final ProductExpiryService expiryService;
    private final ProductExpiryProperties properties;
    private final Clock clock;

    @Scheduled(fixedDelayString = "${vendor.product-expiry.sweep-interval}")
    void sweep() {
        LocalDate businessDate = LocalDate.now(clock.withZone(TimeConstant.VIETNAM_ZONE));
        for (String productId : expiryService.findExpiredOnSaleProductIds(businessDate, properties.sweepBatchSize())) {
            try {
                expiryService.hideIfExpired(productId, businessDate);
            } catch (DataAccessException e) {
                log.warn("Expired product {} not hidden, retried next run: {}", productId, e.getMessage());
            }
        }
    }
}
