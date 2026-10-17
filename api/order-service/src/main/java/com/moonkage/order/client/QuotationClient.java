package com.moonkage.order.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "quotation-service", path = "/internal")
public interface QuotationClient {}
