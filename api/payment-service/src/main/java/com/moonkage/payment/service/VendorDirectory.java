package com.moonkage.payment.service;

import com.moonkage.payment.client.VendorClient;
import feign.FeignException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Which vendor an account owns (BR-11): owner is not a role, so vendor-service is asked (D-19). */
@Component
@RequiredArgsConstructor
public class VendorDirectory {

    private final VendorClient vendorClient;

    public Optional<String> ownedVendorId(String accountId) {
        try {
            return Optional.ofNullable(vendorClient.findByOwner(accountId)).map(v -> v.id());
        } catch (FeignException.NotFound e) {
            return Optional.empty();
        }
    }
}
