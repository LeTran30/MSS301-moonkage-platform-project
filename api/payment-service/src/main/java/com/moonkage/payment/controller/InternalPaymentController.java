package com.moonkage.payment.controller;

import com.moonkage.payment.dto.request.CreatePaymentRequest;
import com.moonkage.payment.dto.response.CreatePaymentResponse;
import com.moonkage.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    private final PaymentService paymentService;

    /** A PENDING payment and the VNPay link to pay it; 409 PAYMENT_002 when already paid (P-03). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatePaymentResponse create(@Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.create(request);
    }
}
