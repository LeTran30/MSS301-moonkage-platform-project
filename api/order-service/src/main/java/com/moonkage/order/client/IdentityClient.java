package com.moonkage.order.client;

import com.moonkage.order.client.dto.AccountNameView;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {

    /** The name an account shows (the buyer in a Shop's chat inbox); 404 when unknown. */
    @GetMapping("/accounts/{accountId}/name")
    AccountNameView getName(@PathVariable String accountId);
}
