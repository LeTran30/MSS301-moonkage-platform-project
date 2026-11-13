package com.moonkage.order.client;

import com.moonkage.order.client.dto.ReserveStockRequest;
import com.moonkage.order.client.dto.ReturnStockRequest;
import com.moonkage.order.client.dto.StockReservationResponse;
import com.moonkage.order.client.dto.VendorView;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Internal API of vendor-service (vendor.md): stock held for checkouts (BR-28, P-01) and the vendor an account owns.
 * Each call with the same checkoutId answers the same, so retries are safe. 409 on reserve or commit means the stock
 * is not there.
 */
@FeignClient(name = "vendor-service", path = "/internal")
public interface VendorClient {

    @PostMapping("/stock/reservations")
    StockReservationResponse reserve(@RequestBody ReserveStockRequest request);

    /** On payment.succeeded; holds again first when the hold had already been released (late IPN). */
    @PostMapping("/stock/reservations/{checkoutId}/commit")
    StockReservationResponse commit(@PathVariable String checkoutId);

    @DeleteMapping("/stock/reservations/{checkoutId}")
    void release(@PathVariable String checkoutId);

    /** A Shop rejected a paid order (Q-01): its pieces go back on sale; again for the same order changes nothing. */
    @PostMapping("/stock/reservations/returns")
    void returnStock(@RequestBody ReturnStockRequest request);

    /** Who owns a vendor (the other side of an order's chat); 404 when there is no such vendor. */
    @GetMapping("/vendors/{vendorId}")
    VendorView getVendor(@PathVariable String vendorId);

    /** 404 when the account owns no vendor. */
    @GetMapping("/vendors/by-owner/{accountId}")
    VendorView findByOwner(@PathVariable String accountId);
}
