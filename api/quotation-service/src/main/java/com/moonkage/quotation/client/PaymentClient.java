package com.moonkage.quotation.client;

import com.moonkage.quotation.dto.client.CreatePaymentRequest;
import com.moonkage.quotation.dto.client.CreatePaymentResponse;
import com.moonkage.quotation.dto.client.CreateRefundRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/** Contract of docs/architecture/api-db/integration.md; payment-service owns the VNPay transaction. */
@FeignClient(name = "payment-service", path = "/internal")
public interface PaymentClient {

    /**
     * Creates the deposit's payment.
     *
     * <p>{@code acceptanceId} is the idempotency key (BE-08b): the acceptance is the attempt, so a retry after a
     * lost answer answers the same payment instead of creating a second one.
     */
    @PostMapping("/payments")
    CreatePaymentResponse createPayment(
            @RequestHeader("Idempotency-Key") String idempotencyKey, @RequestBody CreatePaymentRequest request);

    @PostMapping("/refunds")
    void createRefund(@RequestBody CreateRefundRequest request);
}
