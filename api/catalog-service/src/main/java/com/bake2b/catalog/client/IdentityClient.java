package com.bake2b.catalog.client;

import com.bake2b.catalog.dto.client.VendorInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {

    /** 404 (FeignException.NotFound) when the user owns no vendor. */
    @GetMapping("/vendors/by-user/{userId}")
    VendorInfo getVendorByOwnerUserId(@PathVariable("userId") String userId);
}
