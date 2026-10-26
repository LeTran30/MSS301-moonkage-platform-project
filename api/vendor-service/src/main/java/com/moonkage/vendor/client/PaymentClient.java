package com.moonkage.vendor.client;

import com.moonkage.vendor.client.dto.CreatePaymentRequest;
import com.moonkage.vendor.client.dto.CreatePaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Internal API of payment-service (docs/architecture/api-db/payment.md): a payment is created only through the root
 * that owns it, here the Vendor for its registration fee. Answers are unwrapped payloads, not ApiResponse. An error
 * stays a FeignException and is answered as DEPENDENCY_UNAVAILABLE.
 */
@FeignClient(name = "payment-service", path = "/internal")
public interface PaymentClient {

    /** A pending payment and the VNPay link to pay it (AC-27.4). */
    @PostMapping("/payments")
    CreatePaymentResponse createPayment(@RequestBody CreatePaymentRequest request);
}
