package com.moonkage.order.service;

import com.moonkage.order.client.VendorClient;
import com.moonkage.order.client.dto.VendorView;
import feign.FeignException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Which vendor an account owns (BR-11): owner is not a role, so vendor-service is asked (D-19). */
@Slf4j
@Component
@RequiredArgsConstructor
public class VendorDirectory {

    private final VendorClient vendorClient;

    /**
     * The account that owns a vendor, to push a chat event to; empty when vendor-service does not know it or cannot
     * be reached, since a missed push only costs the other side a poll.
     */
    public Optional<String> ownerAccountIdOf(String vendorId) {
        try {
            return Optional.ofNullable(vendorClient.getVendor(vendorId)).map(VendorView::ownerAccountId);
        } catch (FeignException e) {
            log.warn("Owner of vendor {} unknown: {}", vendorId, e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<String> ownedVendorId(String accountId) {
        try {
            return Optional.ofNullable(vendorClient.findByOwner(accountId)).map(v -> v.id());
        } catch (FeignException.NotFound e) {
            return Optional.empty();
        }
    }
}
