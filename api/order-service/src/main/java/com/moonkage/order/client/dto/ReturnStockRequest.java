package com.moonkage.order.client.dto;

import java.util.List;

/**
 * Body of vendor-service POST /internal/stock/reservations/returns: the pieces of a rejected order go back on sale
 * (Q-01); again for the same order changes nothing.
 */
public record ReturnStockRequest(String orderId, String checkoutId, List<ReserveStockRequest.Item> items) {}
