package com.moonkage.payment.controller;

import com.moonkage.payment.dto.response.LedgerStateResponse;
import com.moonkage.payment.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal API (integration.md); the gateway refuses /internal/**. */
@RestController
@RequestMapping("/internal/ledgers")
@RequiredArgsConstructor
public class InternalLedgerController {

    private final ReconciliationService reconciliationService;

    /** Whether the vendor already took or asked for part of the order's money (Q-01: rejecting a custom order). */
    @GetMapping("/{orderId}/state")
    public LedgerStateResponse state(@PathVariable String orderId) {
        return reconciliationService.state(orderId);
    }
}
