package com.moonkage.vendor.product;

import com.moonkage.vendor.cakeattribute.CakeAttributeCodes;
import com.moonkage.vendor.cakeattribute.CakeAttributeService;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.outbox.AggregateType;
import com.moonkage.vendor.outbox.OutboxService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Announces the new state of a product after a change, in the transaction of the change (outbox). Call it last,
 * once the product is flushed, so its version is the one committed.
 */
@Component
@RequiredArgsConstructor
class ProductSnapshotPublisher {

    private final OutboxService outboxService;
    private final CakeAttributeService cakeAttributeService;

    /** product.upserted for every change but a removal, hiding included: the copy keeps the status (FR-34). */
    void announceUpserted(Product product) {
        CakeAttributeCodes codes = CakeAttributeCodes.of(cakeAttributeService.getRefs(product.getCakeAttributeIds()));
        ProductSnapshot snapshot = new ProductSnapshot(
                product.getId(),
                product.getVendorId(),
                product.getName(),
                product.getDescription(),
                codes.crusts(),
                codes.fillings(),
                product.getBrand(),
                product.getOrigin(),
                product.isResold(),
                valueOf(product.getPiecesPerBox()),
                product.getListPrice().value(),
                product.getStock(),
                product.getExpiryDate(),
                product.getDeliveryLabel(),
                valueOf(product.getQuoteThreshold()),
                product.getStatus(),
                List.copyOf(product.getImageKeys()),
                product.toPriceTiers().tiers().stream()
                        .map(tier -> new ProductSnapshot.PriceTierSnapshot(
                                tier.fromQty().value(), tier.unitPrice().value()))
                        .toList());
        announce(RabbitConfig.PRODUCT_UPSERTED_ROUTING_KEY, product, snapshot);
    }

    /** product.removed instead of product.upserted (BR-24). */
    void announceRemoved(Product product) {
        announce(
                RabbitConfig.PRODUCT_REMOVED_ROUTING_KEY,
                product,
                new ProductSnapshot.Removed(product.getId(), product.getVendorId(), product.getStatus()));
    }

    private void announce(String routingKey, Product product, Object data) {
        outboxService.enqueueState(routingKey, AggregateType.PRODUCT, product.getId(), product.getVersion(), data);
    }

    private static Integer valueOf(Quantity quantity) {
        return quantity == null ? null : quantity.value();
    }
}
