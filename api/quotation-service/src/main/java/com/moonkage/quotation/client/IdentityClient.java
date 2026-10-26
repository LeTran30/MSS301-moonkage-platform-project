package com.moonkage.quotation.client;

import com.moonkage.quotation.dto.client.NfcStatusResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", path = "/internal")
public interface IdentityClient {

    /** BR-23; also the buyer's legal name and masked ID number for the binding acceptance. */
    @GetMapping("/nfc/status/{accountId}")
    NfcStatusResponse getNfcStatus(@PathVariable("accountId") String accountId);
}
