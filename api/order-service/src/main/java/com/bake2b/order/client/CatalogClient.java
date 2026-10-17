package com.bake2b.order.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "catalog-service", path = "/internal")
public interface CatalogClient {}
