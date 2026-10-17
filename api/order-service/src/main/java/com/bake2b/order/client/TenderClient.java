package com.bake2b.order.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "tender-service", path = "/internal")
public interface TenderClient {}
