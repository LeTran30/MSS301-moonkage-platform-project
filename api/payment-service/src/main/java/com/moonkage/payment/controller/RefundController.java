package com.moonkage.payment.controller;

import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.enums.RefundStatus;
import com.moonkage.payment.exception.ApiResponse;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.security.CurrentUser;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin view of every refund, including those not tied to an order (late or duplicate payment), so the ones VNPay
 * refused can be settled by hand (AC-49.3).
 */
@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    public ApiResponse<PageResponse<RefundResponse>> list(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(defaultValue = "MANUAL_REQUIRED") RefundStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin(caller);
        return ApiResponse.ok(refundService.list(status, page, size));
    }

    /** {@code PATCH /api/refunds/{refundId}}: the admin refunded by hand; MANUAL_REQUIRED becomes SUCCEEDED. */
    @PatchMapping("/{refundId}")
    public ApiResponse<RefundResponse> confirmManual(
            @CurrentUser CurrentUserInfo caller, @PathVariable String refundId) {
        requireAdmin(caller);
        return ApiResponse.ok(refundService.confirmManual(caller, refundId));
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }
}
