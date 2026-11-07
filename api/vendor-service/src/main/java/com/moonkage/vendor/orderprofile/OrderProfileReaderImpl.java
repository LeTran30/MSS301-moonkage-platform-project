package com.moonkage.vendor.orderprofile;

import com.moonkage.vendor.cakeattribute.CakeAttributeCodes;
import com.moonkage.vendor.cakeattribute.CakeAttributeService;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.vendor.OrderProfileReader;
import com.moonkage.vendor.vendor.VendorSnapshot.OrderProfileSnapshot;
import com.moonkage.vendor.vendor.VendorSnapshot.PriceTierSnapshot;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** The order profile as the vendor snapshot carries it (vendor.updated, FR-35). */
@Component
@RequiredArgsConstructor
class OrderProfileReaderImpl implements OrderProfileReader {

    private final OrderProfileRepository orderProfileRepository;
    private final CakeAttributeService cakeAttributeService;

    @Override
    public Optional<OrderProfileSnapshot> snapshotOf(String vendorId) {
        return orderProfileRepository.findByVendorId(vendorId).map(this::toSnapshot);
    }

    private OrderProfileSnapshot toSnapshot(OrderProfile profile) {
        List<PriceTierSnapshot> tiers = profile.toPriceTiers().tiers().stream()
                .map(tier -> new PriceTierSnapshot(
                        tier.fromQty().value(), tier.unitPrice().value()))
                .toList();
        CakeAttributeCodes cakeAttributes =
                CakeAttributeCodes.of(cakeAttributeService.getRefs(profile.getCakeAttributeIds()));
        return new OrderProfileSnapshot(
                profile.getMinQty().value(),
                profile.getLeadTimeDays(),
                tiers,
                Set.copyOf(profile.getCustomTypes()),
                profile.getEarlyBirdOffer(),
                valueOf(profile.getWeeklyCapacity()),
                cakeAttributes.crusts(),
                cakeAttributes.fillings(),
                profile.getPackagingTypes(),
                profile.getLogoPrinting(),
                profile.getDistributedBrands(),
                valueOf(profile.getGatherableQty()));
    }

    private static Integer valueOf(Quantity quantity) {
        return quantity == null ? null : quantity.value();
    }
}
