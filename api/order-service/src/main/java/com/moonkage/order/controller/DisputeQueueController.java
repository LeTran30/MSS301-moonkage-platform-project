package com.moonkage.order.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.PageResponse;
import com.moonkage.order.dto.response.DisputeResponse;
import com.moonkage.order.enums.DisputeStatus;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR-49, Q5.0: the admin's disputes across orders, open or decided. Under {@code /api/orders} so the gateway's order
 * route serves it; the literal path wins over {@code /api/orders/{orderId}}.
 */
@RestController
@RequestMapping("/api/orders/disputes")
@RequiredArgsConstructor
public class DisputeQueueController {

    private final DisputeService disputeService;

    @GetMapping
    public ApiResponse<PageResponse<DisputeResponse>> list(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(defaultValue = "OPEN") DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(disputeService.list(caller, status, page, size));
    }
}
