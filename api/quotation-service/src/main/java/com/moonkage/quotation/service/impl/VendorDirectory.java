package com.moonkage.quotation.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Vendor facts from vendor_snapshots: ownership (BR-22), whether it takes orders (BR-20, BR-31), reference prices. */
@Slf4j
@Component
@RequiredArgsConstructor
class VendorDirectory {

    private final VendorSnapshotRepository vendorSnapshotRepository;
    private final ObjectMapper objectMapper;

    VendorSnapshot getVendor(String vendorId) {
        return vendorSnapshotRepository
                .findById(vendorId)
                .orElseThrow(() -> new AppException(ErrorCode.VENDOR_NOT_FOUND));
    }

    Optional<VendorSnapshot> findOwnedBy(String accountId) {
        return accountId == null ? Optional.empty() : vendorSnapshotRepository.findFirstByOwnerAccountId(accountId);
    }

    /** The vendor the caller acts for when quoting; an account without one cannot. */
    VendorSnapshot getOwnedBy(String accountId) {
        return findOwnedBy(accountId).orElseThrow(() -> new AppException(ErrorCode.ACCESS_DENIED));
    }

    /** The owner check of every vendor-side call (D-19: being an owner is not a role). */
    VendorSnapshot getOwned(String accountId, String vendorId) {
        VendorSnapshot vendor = getVendor(vendorId);
        if (!vendor.isOwnedBy(accountId)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return vendor;
    }

    Map<String, String> namesOf(Collection<String> vendorIds) {
        return vendorSnapshotRepository.findAllById(vendorIds).stream()
                .collect(Collectors.toMap(VendorSnapshot::getVendorId, VendorSnapshot::getBusinessName));
    }

    /**
     * AC-38.2: the unit price of the highest reference tier whose {@code fromQty} the quantity reaches, null when
     * none does. Reference only (BR-05).
     */
    Long suggestedUnitPrice(VendorSnapshot vendor, int quantity) {
        JsonNode tiers;
        try {
            tiers = objectMapper.readTree(vendor.getRefPriceTiers());
        } catch (JsonProcessingException e) {
            log.warn("Unreadable ref_price_tiers of vendor {}", vendor.getVendorId(), e);
            return null;
        }
        Long price = null;
        int bestFrom = 0;
        for (JsonNode tier : tiers) {
            int from = tier.path("fromQty").asInt(Integer.MAX_VALUE);
            if (from <= quantity && from >= bestFrom && tier.hasNonNull("unitPrice")) {
                bestFrom = from;
                price = tier.get("unitPrice").asLong();
            }
        }
        return price;
    }
}
