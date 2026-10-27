package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.request.ProductSnapshotRequest;
import com.moonkage.catalog.dto.response.ProductSnapshotResponse;

/** Products and delivery fees of a cart for order-service (D-14, BR-30). */
public interface ProductSnapshotService {

    ProductSnapshotResponse snapshot(ProductSnapshotRequest request);
}
