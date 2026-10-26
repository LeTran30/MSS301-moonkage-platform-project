package com.moonkage.vendor.common.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Price tiers of a product or an order profile, ordered by {@code fromQty}, no two starting at the same quantity.
 * Empty means no tiers: the list price applies.
 */
public record PriceTiers(List<PriceTier> tiers) {

    public PriceTiers {
        if (tiers == null) {
            throw new AppException(ErrorCode.PRICE_TIERS_INVALID);
        }
        Set<Quantity> starts = new HashSet<>();
        for (PriceTier tier : tiers) {
            if (tier == null || !starts.add(tier.fromQty())) {
                throw new AppException(ErrorCode.PRICE_TIERS_INVALID);
            }
        }
        tiers = tiers.stream()
                .sorted(Comparator.comparingInt(tier -> tier.fromQty().value()))
                .toList();
    }

    public static PriceTiers of(List<PriceTier> tiers) {
        return new PriceTiers(tiers);
    }

    public boolean isEmpty() {
        return tiers.isEmpty();
    }

    /** The tier with the largest {@code fromQty} not above {@code quantity}; empty when none starts that low. */
    public Optional<PriceTier> tierFor(Quantity quantity) {
        return tiers.stream()
                .filter(tier -> tier.fromQty().value() <= quantity.value())
                .reduce((lower, higher) -> higher);
    }
}
