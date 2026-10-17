package com.moonkage.order.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "catalog-service", path = "/internal")
public interface CatalogClient {}
