package com.moonkage.vendor.web;

import com.moonkage.vendor.product.StockService;
import com.moonkage.vendor.product.dto.request.ReserveStockRequest;
import com.moonkage.vendor.product.dto.response.StockReservationResponse;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stock held for the buy-now checkouts of order-service (BR-28, P-01). Called by other services through OpenFeign
 * only; the gateway blocks /internal/** from outside. Unwrapped.
 */
@Hidden
@RestController
@RequestMapping("/internal/stock/reservations")
@RequiredArgsConstructor
public class InternalStockController {

    private final StockService stockService;

    /** When the checkout is made; again with the same checkoutId answers the same. */
    @PostMapping
    public ResponseEntity<StockReservationResponse> reserve(@Valid @RequestBody ReserveStockRequest request) {
        return ResponseEntity.ok(stockService.reserve(request));
    }

    /** On payment.succeeded; 409 STOCK_UNAVAILABLE means refund (LATE_PAYMENT). */
    @PostMapping("/{checkoutId}/commit")
    public ResponseEntity<StockReservationResponse> commit(@PathVariable String checkoutId) {
        return ResponseEntity.ok(stockService.commit(checkoutId));
    }

    /** On payment.failed, or when the checkout expires at order-service. */
    @DeleteMapping("/{checkoutId}")
    public ResponseEntity<Void> release(@PathVariable String checkoutId) {
        stockService.release(checkoutId);
        return ResponseEntity.noContent().build();
    }
}
