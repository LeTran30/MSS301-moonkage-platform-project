package com.moonkage.payment.service;

import com.moonkage.payment.dto.request.CreatePaymentRequest;
import com.moonkage.payment.dto.response.CreatePaymentResponse;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.PaymentResponse;
import com.moonkage.payment.dto.response.VnpayIpnResponse;
import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.security.CurrentUserInfo;
import java.time.Instant;
import java.util.Map;

/** Root Payment (payment.md): one VNPay transaction for what a purpose and a reference name. */
public interface PaymentService {

    /**
     * A PENDING payment and its VNPay pay URL; only the root that owns the reference calls it (POST
     * /internal/payments). Refused when the purpose and reference are already paid (P-03).
     */
    CreatePaymentResponse create(CreatePaymentRequest request);

    /**
     * Records the result VNPay sends server to server (BR-25): the only place a payment becomes SUCCEEDED or is
     * declined. Safe to repeat; a second success for the same purpose and reference is DUPLICATE and refunded (P-03).
     *
     * @param callback every query parameter of the IPN
     */
    VnpayIpnResponse handleIpn(Map<String, String> callback);

    /**
     * The payment VNPay sent the payer back for, after checking the signature. Changes nothing: the state comes from
     * the IPN only (BR-25).
     */
    PaymentResponse readReturn(Map<String, String> callback);

    /**
     * Admin: payments of one purpose (e.g. REGISTRATION_FEE, AC-51.3) or all, created in [from, to).
     *
     * @param from null = from the beginning
     * @param to null = up to now
     */
    PageResponse<PaymentResponse> list(
            CurrentUserInfo caller, PaymentPurpose purpose, Instant from, Instant to, int page, int size);

    /** The caller's own payment; an admin sees any. */
    PaymentResponse get(String paymentId, CurrentUserInfo caller);

    /**
     * Fails the PENDING payments past their deadline and announces payment.failed, so the owner releases what it
     * held. A success VNPay confirms later still counts (P-01).
     *
     * @return how many payments failed
     */
    int expireOverdue();
}
