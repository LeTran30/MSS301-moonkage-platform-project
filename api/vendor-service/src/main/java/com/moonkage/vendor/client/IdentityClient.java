package com.moonkage.vendor.client;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {}
