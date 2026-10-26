package com.moonkage.vendor.product;

import com.moonkage.vendor.product.dto.request.ReserveStockRequest;
import com.moonkage.vendor.product.dto.response.StockReservationResponse;
import java.time.Instant;
import java.util.List;

/**
 * Stock held for the buy-now checkouts of order-service (BR-28, P-01). order-service drives each checkout: hold,
 * then commit when paid or release when not; vendor-service releases on its own only a hold past its expiry. Every
 * change of a product's stock announces the product (product.upserted).
 */
public interface StockService {

    /**
     * Holds every line or none. A checkout already held answers what it holds, whatever its status now, as long as
     * it asks for the same lines (RESERVATION_MISMATCH otherwise).
     *
     * @throws com.moonkage.vendor.common.exception.AppException STOCK_UNAVAILABLE naming each product that is
     *     missing, not on sale, of a Shop that may not sell, or short
     */
    StockReservationResponse reserve(ReserveStockRequest request);

    /**
     * Paid: the pieces are sold. A checkout released already (the payment came late) takes its pieces again, all or
     * none; STOCK_UNAVAILABLE when it cannot, and order-service refunds (LATE_PAYMENT). Committing again answers
     * the same.
     */
    StockReservationResponse commit(String checkoutId);

    /** Not paid: the pieces go back. Nothing to do for an unknown or released checkout; a committed one refuses. */
    void release(String checkoutId);

    /** Checkouts with a hold past its expiry at {@code now}, at most {@code limit}. */
    List<String> findExpiredCheckouts(Instant now, int limit);

    /** Releases the checkout if it is still held and expired at {@code now}; a commit that came first wins. */
    void releaseIfExpired(String checkoutId, Instant now);
}
