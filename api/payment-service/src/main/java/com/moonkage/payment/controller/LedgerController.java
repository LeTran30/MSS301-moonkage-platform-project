package com.moonkage.payment.controller;

import com.moonkage.payment.dto.request.CreateDisbursementRequest;
import com.moonkage.payment.dto.request.ReviewDisbursementRequest;
import com.moonkage.payment.dto.response.DisbursementResponse;
import com.moonkage.payment.dto.response.LedgerEntryResponse;
import com.moonkage.payment.dto.response.LedgerResponse;
import com.moonkage.payment.dto.response.PageResponse;
import com.moonkage.payment.dto.response.PayoutResponse;
import com.moonkage.payment.dto.response.RefundResponse;
import com.moonkage.payment.exception.ApiResponse;
import com.moonkage.payment.security.CurrentUser;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.ReconciliationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Root Ledger (payment.md): one per order, id = orderId. Vendor owner and admins. */
@RestController
@RequestMapping("/api/ledgers")
@RequiredArgsConstructor
public class LedgerController {

    private final ReconciliationService reconciliationService;

    /**
     * FR-43: the vendor owner's reconciliation ({@code vendorId} of their vendor). Admin: everything, or
     * {@code payableOnly=true} for the orders waiting for payout (AC-48.1).
     */
    @GetMapping
    public ApiResponse<PageResponse<LedgerResponse>> list(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(required = false) String vendorId,
            @RequestParam(defaultValue = "false") boolean payableOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(reconciliationService.list(caller, vendorId, payableOnly, page, size));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<LedgerResponse> get(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reconciliationService.get(caller, orderId));
    }

    /** NFR-07: the order's money journal, read only. */
    @GetMapping("/{orderId}/entries")
    public ApiResponse<List<LedgerEntryResponse>> entries(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reconciliationService.entries(caller, orderId));
    }

    @GetMapping("/{orderId}/refunds")
    public ApiResponse<List<RefundResponse>> refunds(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reconciliationService.refunds(caller, orderId));
    }

    @GetMapping("/{orderId}/disbursements")
    public ApiResponse<List<DisbursementResponse>> disbursements(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reconciliationService.disbursements(caller, orderId));
    }

    /** FR-41: the vendor owner asks for part of the deposit. */
    @PostMapping("/{orderId}/disbursements")
    public ApiResponse<DisbursementResponse> requestDisbursement(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody CreateDisbursementRequest request) {
        return ApiResponse.ok(reconciliationService.requestDisbursement(caller, orderId, request));
    }

    /** FR-47: an admin approves or rejects. */
    @PatchMapping("/{orderId}/disbursements/{requestId}")
    public ApiResponse<DisbursementResponse> reviewDisbursement(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @PathVariable String requestId,
            @Valid @RequestBody ReviewDisbursementRequest request) {
        return ApiResponse.ok(reconciliationService.reviewDisbursement(caller, orderId, requestId, request));
    }

    /** FR-48: an admin pays the vendor what is held, once per order. */
    @PutMapping("/{orderId}/payout")
    public ApiResponse<PayoutResponse> payout(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reconciliationService.payout(caller, orderId));
    }
}
