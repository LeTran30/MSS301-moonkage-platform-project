package com.moonkage.quotation.client;

import com.moonkage.quotation.dto.client.CreatePaymentRequest;
import com.moonkage.quotation.dto.client.CreatePaymentResponse;
import com.moonkage.quotation.dto.client.CreateRefundRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/** Contract of docs/architecture/api-db/integration.md; payment-service owns the VNPay transaction. */
@FeignClient(name = "payment-service", path = "/internal")
public interface PaymentClient {

    @PostMapping("/payments")
    CreatePaymentResponse createPayment(@RequestBody CreatePaymentRequest request);

    @PostMapping("/refunds")
    void createRefund(@RequestBody CreateRefundRequest request);
}
