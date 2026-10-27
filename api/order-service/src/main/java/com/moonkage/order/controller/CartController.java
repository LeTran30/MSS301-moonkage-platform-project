package com.moonkage.order.controller;

import com.moonkage.order.dto.request.AddCartItemRequest;
import com.moonkage.order.dto.request.UpdateCartItemRequest;
import com.moonkage.order.dto.response.CartResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Root Cart (order.md): the caller's own multi-shop cart (FR-08). */
@RestController
@RequestMapping("/api/carts/me")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /** Split by Shop with each Shop's delivery fee to {@code provinceCode} (AC-09.1, BR-30). */
    @GetMapping
    public ApiResponse<CartResponse> get(@CurrentUser CurrentUserInfo caller, @RequestParam String provinceCode) {
        return ApiResponse.ok(cartService.get(caller, provinceCode));
    }

    /** 409 CART_004 / CART_005 above the stock or at the quote threshold: send a request instead (AC-08.2). */
    @PostMapping("/items")
    public ApiResponse<CartResponse.Line> addItem(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody AddCartItemRequest request) {
        return ApiResponse.ok(cartService.addItem(caller, request));
    }

    @PatchMapping("/items/{itemId}")
    public ApiResponse<CartResponse.Line> updateItem(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.ok(cartService.updateItem(caller, itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(@CurrentUser CurrentUserInfo caller, @PathVariable String itemId) {
        cartService.removeItem(caller, itemId);
        return ResponseEntity.noContent().build();
    }
}
