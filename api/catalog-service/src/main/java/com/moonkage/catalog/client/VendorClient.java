package com.moonkage.catalog.client;

import com.moonkage.catalog.dto.client.VendorInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "vendor-service", path = "/internal")
public interface VendorClient {

    /** 404 (FeignException.NotFound) when the account owns no vendor. */
    @GetMapping("/vendors/by-owner/{accountId}")
    VendorInfo getVendorByOwnerAccountId(@PathVariable("accountId") String accountId);
}
