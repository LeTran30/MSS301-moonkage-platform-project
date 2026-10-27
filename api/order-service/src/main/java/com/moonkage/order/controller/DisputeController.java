package com.moonkage.order.controller;

import com.moonkage.order.dto.request.EvidenceRequest;
import com.moonkage.order.dto.request.OpenDisputeRequest;
import com.moonkage.order.dto.request.ResolveDisputeRequest;
import com.moonkage.order.dto.response.DisputeResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The dispute of an order (order.md, FR-12, FR-49): one open at a time. */
@RestController
@RequestMapping("/api/orders/{orderId}/dispute")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @GetMapping
    public ApiResponse<DisputeResponse> get(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(disputeService.get(caller, orderId));
    }

    /** FR-12: the buyer, while the complaint window is open. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DisputeResponse> open(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody OpenDisputeRequest request) {
        return ApiResponse.created(disputeService.open(caller, orderId, request));
    }

    /** AC-49.1: evidence of the buyer or the vendor owner. */
    @PostMapping("/evidences")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DisputeResponse> addEvidence(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody EvidenceRequest request) {
        return ApiResponse.created(disputeService.addEvidence(caller, orderId, request));
    }

    /** FR-49: the admin's decision. */
    @PatchMapping
    public ApiResponse<DisputeResponse> resolve(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody ResolveDisputeRequest request) {
        return ApiResponse.ok(disputeService.resolve(caller, orderId, request));
    }
}
