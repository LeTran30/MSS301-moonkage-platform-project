package com.moonkage.vendor.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {

    /** 404 (FeignException.NotFound) when no account has this email. */
    @GetMapping("/accounts/by-email")
    AccountRef getAccountByEmail(@RequestParam("email") String email);

    record AccountRef(String accountId) {}
}
