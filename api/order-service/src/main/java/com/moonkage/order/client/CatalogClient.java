package com.moonkage.order.client;

import com.moonkage.order.client.dto.ProductSnapshotRequest;
import com.moonkage.order.client.dto.ProductSnapshotResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/** Internal API of catalog-service: the only place the delivery fee of a buy-now order is worked out (D-14). */
@FeignClient(name = "catalog-service", path = "/internal")
public interface CatalogClient {

    @PostMapping("/products/snapshot")
    ProductSnapshotResponse snapshot(@RequestBody ProductSnapshotRequest request);
}
