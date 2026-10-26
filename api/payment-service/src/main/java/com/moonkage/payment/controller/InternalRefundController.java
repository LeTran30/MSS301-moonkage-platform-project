package com.moonkage.payment.controller;

import com.moonkage.payment.dto.request.RefundRequest;
import com.moonkage.payment.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Internal API (integration.md); the gateway refuses /internal/**. */
@RestController
@RequestMapping("/internal/refunds")
@RequiredArgsConstructor
public class InternalRefundController {

    private final RefundService refundService;

    /** Once per payment and reason: a repeat answers 204 and changes nothing. */
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void request(@Valid @RequestBody RefundRequest request) {
        refundService.requestForPayment(request);
    }
}
