package com.moonkage.payment.messaging;

import com.moonkage.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Fails PENDING payments past their deadline, so checkouts and quote locks are released (P-01). */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentExpiryJob {

    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${payment.expiry-sweep-interval:60s}")
    public void expireOverdue() {
        int failed = paymentService.expireOverdue();
        if (failed > 0) {
            log.info("{} payments expired", failed);
        }
    }
}
