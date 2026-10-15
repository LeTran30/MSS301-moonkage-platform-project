package com.bake2b.tender.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "catalog-service", path = "/internal")
public interface CatalogClient {}
