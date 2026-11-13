package com.moonkage.payment.client;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "identity-service", path = "/internal/accounts")
public interface IdentityClient {

    @GetMapping("/admins")
    List<String> findAdminAccountIds();
}
