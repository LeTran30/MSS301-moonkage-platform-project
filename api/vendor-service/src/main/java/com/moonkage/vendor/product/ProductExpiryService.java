package com.moonkage.vendor.product;

import java.time.LocalDate;
import java.util.List;

/** Internal operations used by the expiry sweep; each mutation runs in its own transaction. */
interface ProductExpiryService {

    List<String> findExpiredOnSaleProductIds(LocalDate businessDate, int limit);

    void hideIfExpired(String productId, LocalDate businessDate);
}
