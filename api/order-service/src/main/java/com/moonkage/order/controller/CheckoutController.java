package com.moonkage.order.controller;

import com.moonkage.order.dto.request.CreateCheckoutRequest;
import com.moonkage.order.dto.response.CheckoutResponse;
import com.moonkage.order.dto.response.CreateCheckoutResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Root Checkout (order.md): pay the whole cart once; one order per Shop when paid (FR-09, BR-29). */
@RestController
@RequestMapping("/api/checkouts")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    /** Holds the stock and answers the VNPay link (BR-28); no order exists until the payment succeeds. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CreateCheckoutResponse> create(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody CreateCheckoutRequest request) {
        return ApiResponse.created(checkoutService.create(caller, request));
    }

    /** The result page polls it: status, and the order ids once paid (AC-09.7). */
    @GetMapping("/{checkoutId}")
    public ApiResponse<CheckoutResponse> get(@CurrentUser CurrentUserInfo caller, @PathVariable String checkoutId) {
        return ApiResponse.ok(checkoutService.get(caller, checkoutId));
    }
}
