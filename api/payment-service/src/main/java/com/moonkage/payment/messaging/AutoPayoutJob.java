package com.moonkage.payment.messaging;

import com.moonkage.payment.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Pays every completed order out to its Shop owner's wallet (FR-48), so no admin has to approve each one. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoPayoutJob {

    private final ReconciliationService reconciliationService;

    @Scheduled(fixedDelayString = "${payment.auto-payout-sweep-interval:60s}")
    public void payOutCompleted() {
        int paid = reconciliationService.payOutCompleted();
        if (paid > 0) {
            log.info("{} completed orders paid out to their Shops", paid);
        }
    }
}
