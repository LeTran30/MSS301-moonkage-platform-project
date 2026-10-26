package com.moonkage.order.service;

import com.moonkage.order.dto.request.CreateCheckoutRequest;
import com.moonkage.order.dto.response.CheckoutResponse;
import com.moonkage.order.dto.response.CreateCheckoutResponse;
import com.moonkage.order.security.CurrentUserInfo;

/** Root Checkout (order.md, D-10, P-01): one payment for the whole cart, one order per Shop once it succeeds. */
public interface CheckoutService {

    /**
     * Holds the stock of the whole cart at vendor-service (BR-28), works out each Shop's delivery fee at
     * catalog-service (BR-30), and asks payment-service for the VNPay link. No order exists yet (FR-09).
     */
    CreateCheckoutResponse create(CurrentUserInfo caller, CreateCheckoutRequest request);

    CheckoutResponse get(CurrentUserInfo caller, String checkoutId);

    /**
     * payment.succeeded (CHECKOUT): commits the held stock and creates one order per Shop with the ids issued at
     * checkout (BR-29). Paid too late and the stock is gone: refund LATE_PAYMENT instead (P-01). Safe to repeat.
     */
    void onPaid(String eventId, String checkoutId, String paymentId);

    /** payment.failed (CHECKOUT): the stock goes back. Safe to repeat. */
    void onPaymentFailed(String eventId, String checkoutId);

    /**
     * Expires the checkouts nobody paid in time and gives their stock back (P-01).
     *
     * @return how many expired
     */
    int expireOverdue();
}
