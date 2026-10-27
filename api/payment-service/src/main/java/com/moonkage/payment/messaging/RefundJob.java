package com.moonkage.payment.messaging;

import com.moonkage.payment.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Sends PENDING refunds to VNPay; a refused one waits for an admin (AC-49.3). */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefundJob {

    private final RefundService refundService;

    @Scheduled(fixedDelayString = "${payment.refund-interval:30s}")
    public void processPending() {
        int handled = refundService.processPending();
        if (handled > 0) {
            log.info("{} refunds sent to VNPay", handled);
        }
    }
}
