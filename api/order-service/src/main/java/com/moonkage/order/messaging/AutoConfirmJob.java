package com.moonkage.order.messaging;

import com.moonkage.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Confirms for the buyer the delivered orders nobody confirmed before their complaint deadline (FR-11, AC-48.1). */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoConfirmJob {

    private final OrderService orderService;

    @Scheduled(fixedDelayString = "${order.auto-confirm-sweep-interval:60s}")
    public void confirmOverdue() {
        int confirmed = orderService.confirmOverdue();
        if (confirmed > 0) {
            log.info("{} delivered orders confirmed by the system", confirmed);
        }
    }
}
