package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.outbox.OutboxService;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Announces the new state of a vendor after a change, in the transaction of the change (outbox). Call it last, once
 * the vendor and its delivery areas and order profile are as they will be committed.
 */
@Component
@RequiredArgsConstructor
class VendorSnapshotPublisher {

    private final VendorRepository vendorRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final OrderProfileRepository orderProfileRepository;
    private final OutboxService outboxService;

    /** vendor.updated: any change copies care about (FR-28, FR-35, FR-45, BR-31). */
    void announceUpdated(Vendor vendor, String changedBy) {
        announce(RabbitConfig.VENDOR_UPDATED_ROUTING_KEY, vendor, changedBy);
    }

    /** vendor.locked instead of vendor.updated, so copies and the owner's notification see one event (FR-46). */
    void announceLocked(Vendor vendor, String changedBy) {
        announce(RabbitConfig.VENDOR_LOCKED_ROUTING_KEY, vendor, changedBy);
    }

    private void announce(String routingKey, Vendor vendor, String changedBy) {
        // the flush writes pending changes, so the version read below is the one committed
        vendorRepository.flush();
        VendorSnapshotEvent event = new VendorSnapshotEvent(
                UUID.randomUUID().toString(),
                vendor.getId(),
                vendor.getVersion(),
                vendor.getOwnerAccountId(),
                vendor.getBusinessName(),
                vendor.getStatus(),
                vendor.getStatusReason(),
                vendor.canOperate(),
                vendor.isSellsShop(),
                vendor.isAcceptsOrders(),
                deliveryAreaRepository.findByVendorId(vendor.getId()).stream()
                        .map(area -> area.getProvinceCode().value())
                        .sorted()
                        .toList(),
                vendor.getLocalDeliveryFee() == null
                        ? null
                        : vendor.getLocalDeliveryFee().value(),
                orderProfileRepository
                        .findByVendorId(vendor.getId())
                        .map(VendorSnapshotPublisher::toSnapshot)
                        .orElse(null),
                changedBy,
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }

    private static VendorSnapshotEvent.OrderProfileSnapshot toSnapshot(OrderProfile profile) {
        List<VendorSnapshotEvent.PriceTierSnapshot> tiers = profile.toPriceTiers().tiers().stream()
                .map(tier -> new VendorSnapshotEvent.PriceTierSnapshot(
                        tier.fromQty().value(), tier.unitPrice().value()))
                .toList();
        return new VendorSnapshotEvent.OrderProfileSnapshot(
                profile.getMinQty().value(),
                profile.getLeadTimeDays(),
                tiers,
                Set.copyOf(profile.getCustomTypes()),
                profile.getEarlyBirdOffer(),
                valueOf(profile.getWeeklyCapacity()),
                profile.getPackagingTypes(),
                profile.getLogoPrinting(),
                profile.getDistributedBrands(),
                valueOf(profile.getGatherableQty()));
    }

    private static Integer valueOf(Quantity quantity) {
        return quantity == null ? null : quantity.value();
    }
}
