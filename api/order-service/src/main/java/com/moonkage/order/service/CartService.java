package com.moonkage.order.service;

import com.moonkage.order.dto.request.AddCartItemRequest;
import com.moonkage.order.dto.request.UpdateCartItemRequest;
import com.moonkage.order.dto.response.CartResponse;
import com.moonkage.order.security.CurrentUserInfo;

/** Root Cart (order.md): one multi-shop cart per account (FR-08). */
public interface CartService {

    /** The cart split by Shop, with the delivery fee of each Shop to {@code provinceCode} (AC-09.1, BR-30). */
    CartResponse get(CurrentUserInfo caller, String provinceCode);

    /**
     * Adds to the line of the product, or opens it. Refused for the caller's own product (BR-22), above the stock
     * on sale or at the vendor's quote threshold (AC-08.2): the buyer then sends a request instead.
     */
    CartResponse.Line addItem(CurrentUserInfo caller, AddCartItemRequest request);

    CartResponse.Line updateItem(CurrentUserInfo caller, String itemId, UpdateCartItemRequest request);

    void removeItem(CurrentUserInfo caller, String itemId);
}
