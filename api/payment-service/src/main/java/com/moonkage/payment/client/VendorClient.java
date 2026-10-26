package com.moonkage.payment.client;

import com.moonkage.payment.client.dto.VendorView;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/** Internal API of vendor-service: which vendor an account owns (owner is not a role, D-19). */
@FeignClient(name = "vendor-service", path = "/internal")
public interface VendorClient {

    /** 404 when the account owns no vendor. */
    @GetMapping("/vendors/by-owner/{accountId}")
    VendorView findByOwner(@PathVariable String accountId);
}
