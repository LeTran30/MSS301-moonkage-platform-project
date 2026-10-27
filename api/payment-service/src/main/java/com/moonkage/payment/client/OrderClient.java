package com.moonkage.payment.client;

import com.moonkage.payment.client.dto.PayoutLockResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

/** Internal API of order-service (order.md). */
@FeignClient(name = "order-service", path = "/internal")
public interface OrderClient {

    /**
     * P-02: locks the order for payout when it may be paid out; 409 when not (not received nor past the complaint
     * deadline, or a dispute is open). Calling again answers the same lock.
     */
    @PostMapping("/orders/{orderId}/payout-lock")
    PayoutLockResponse lockForPayout(@PathVariable String orderId);
}
