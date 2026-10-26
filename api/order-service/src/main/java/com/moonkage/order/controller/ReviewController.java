package com.moonkage.order.controller;

import com.moonkage.order.dto.request.CreateReviewRequest;
import com.moonkage.order.dto.response.ReviewResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Reviews written from an order (FR-11, BR-32). Guests read a product's reviews from catalog-service
 * ({@code GET /api/products/{productId}/reviews}).
 */
@RestController
@RequestMapping("/api/orders/{orderId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<ReviewResponse>> list(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(reviewService.list(caller, orderId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> create(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.created(reviewService.create(caller, orderId, request));
    }
}
