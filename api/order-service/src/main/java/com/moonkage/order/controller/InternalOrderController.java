package com.moonkage.order.controller;

import com.moonkage.order.dto.response.PayoutLockResponse;
import com.moonkage.order.service.DisputeService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/** Called by payment-service through OpenFeign only; the gateway blocks /internal/**. Unwrapped. */
@Hidden
@RestController
@RequiredArgsConstructor
public class InternalOrderController {

    private final DisputeService disputeService;

    /** P-02: 200 when the order may be paid out (and stays locked), 409 DISPUTE_006 otherwise. */
    @PostMapping("/internal/orders/{orderId}/payout-lock")
    public PayoutLockResponse lockForPayout(@PathVariable String orderId) {
        return disputeService.lockForPayout(orderId);
    }
}
