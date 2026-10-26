package com.moonkage.payment.controller;

import com.moonkage.payment.dto.response.PaymentResponse;
import com.moonkage.payment.dto.response.VnpayIpnResponse;
import com.moonkage.payment.exception.ApiResponse;
import com.moonkage.payment.security.CurrentUser;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.PaymentService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Root Payment (docs/architecture/api-db/payment.md). A payment is created only through the root that owns it (POST
 * /internal/payments), never here. The two VNPay callbacks are open: the gateway lets them through without a token
 * and the signature is what is checked.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** FR-09: the state of the caller's payment; the result page polls it until the IPN arrived. */
    @GetMapping("/{paymentId}")
    public ApiResponse<PaymentResponse> get(@CurrentUser CurrentUserInfo caller, @PathVariable String paymentId) {
        return ApiResponse.ok(paymentService.get(paymentId, caller));
    }

    /**
     * BR-25: VNPay server-to-server result, the only thing that marks a payment paid. Always HTTP 200 with the
     * RspCode VNPay expects, never the ApiResponse envelope.
     */
    @GetMapping("/vnpay/ipn")
    public VnpayIpnResponse ipn(@RequestParam Map<String, String> callback) {
        return paymentService.handleIpn(callback);
    }

    /**
     * The web result page forwards the query VNPay redirected the payer with; answers which payment it was, after
     * checking the signature. Changes nothing (BR-25).
     */
    @GetMapping("/vnpay/return")
    public ApiResponse<PaymentResponse> vnpayReturn(@RequestParam Map<String, String> callback) {
        return ApiResponse.ok(paymentService.readReturn(callback));
    }
}
