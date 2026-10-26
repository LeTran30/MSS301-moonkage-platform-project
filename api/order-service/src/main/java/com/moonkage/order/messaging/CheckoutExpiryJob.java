package com.moonkage.order.messaging;

import com.moonkage.order.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Expires unpaid checkouts and gives their stock back (BR-28, P-01). */
@Slf4j
@Component
@RequiredArgsConstructor
public class CheckoutExpiryJob {

    private final CheckoutService checkoutService;

    @Scheduled(fixedDelayString = "${order.checkout-expiry-sweep-interval:60s}")
    public void expireOverdue() {
        int expired = checkoutService.expireOverdue();
        if (expired > 0) {
            log.info("{} checkouts expired", expired);
        }
    }
}
