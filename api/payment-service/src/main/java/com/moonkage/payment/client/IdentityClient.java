package com.moonkage.payment.client;

import com.moonkage.payment.client.dto.AccountContact;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/** Internal API of identity-service: where to email a buyer. */
@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {

    /** 404 when the account is unknown. The answer holds an email: never log it (NFR-03). */
    @GetMapping("/accounts/{accountId}/contact")
    AccountContact contact(@PathVariable String accountId);
}
