package com.moonkage.order.client;

import com.moonkage.order.client.dto.CreatePaymentRequest;
import com.moonkage.order.client.dto.CreatePaymentResponse;
import com.moonkage.order.client.dto.RefundRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/** Internal API of payment-service (payment.md): a payment is created only through the root that owns it. */
@FeignClient(name = "payment-service", path = "/internal")
public interface PaymentClient {

    /**
     * 409 when the reference is already paid (P-03).
     *
     * <p>{@code idempotencyKey} names the attempt (the checkoutId, the orderId) so a retry after a lost answer
     * answers the same payment instead of creating a second one (BE-08b).
     */
    @PostMapping("/payments")
    CreatePaymentResponse createPayment(
            @RequestHeader("Idempotency-Key") String idempotencyKey, @RequestBody CreatePaymentRequest request);

    /** Once per payment and reason; a repeat changes nothing. */
    @PostMapping("/refunds")
    void requestRefund(@RequestBody RefundRequest request);
}
