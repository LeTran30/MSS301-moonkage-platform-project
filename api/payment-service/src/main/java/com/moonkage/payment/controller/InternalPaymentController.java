package com.moonkage.payment.controller;

import com.moonkage.payment.dto.request.CreatePaymentRequest;
import com.moonkage.payment.dto.response.CreatePaymentResponse;
import com.moonkage.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal API (integration.md): the gateway refuses /internal/**, only order, quotation and vendor call it.
 * Answers are the payload itself, not ApiResponse.
 */
@RestController
@RequestMapping("/internal/payments")
@RequiredArgsConstructor
public class InternalPaymentController {

    private static final String IDEMPOTENCY_KEY = "Idempotency-Key";

    private final PaymentService paymentService;

    /**
     * A PENDING payment and the VNPay link to pay it; 409 PAYMENT_002 when already paid (P-03).
     *
     * <p>{@code Idempotency-Key} names the attempt (the acceptanceId, the checkoutId, the vendorId). The same key
     * always answers the same payment, so a retry after a lost answer never charges the buyer twice (BE-08b).
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatePaymentResponse create(
            @RequestHeader(value = IDEMPOTENCY_KEY, required = false) String idempotencyKey,
            @Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.create(request, idempotencyKey);
    }
}
