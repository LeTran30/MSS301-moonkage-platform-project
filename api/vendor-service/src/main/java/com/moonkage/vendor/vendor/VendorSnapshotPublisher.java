package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.outbox.AggregateType;
import com.moonkage.vendor.outbox.OutboxService;
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
    private final DeliveryAreaReader deliveryAreaReader;
    private final OrderProfileReader orderProfileReader;
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
        VendorSnapshot snapshot = new VendorSnapshot(
                vendor.getId(),
                vendor.getOwnerAccountId(),
                vendor.getBusinessName(),
                vendor.getProvinceCode() == null
                        ? null
                        : vendor.getProvinceCode().value(),
                vendor.getStatus(),
                vendor.getStatusReason(),
                vendor.canOperate(),
                vendor.isSellsShop(),
                vendor.isAcceptsOrders(),
                deliveryAreaReader.provinceCodesOf(vendor.getId()),
                vendor.getLocalDeliveryFee() == null
                        ? null
                        : vendor.getLocalDeliveryFee().value(),
                orderProfileReader.snapshotOf(vendor.getId()).orElse(null),
                changedBy);
        outboxService.enqueueState(routingKey, AggregateType.VENDOR, vendor.getId(), vendor.getVersion(), snapshot);
    }
}
