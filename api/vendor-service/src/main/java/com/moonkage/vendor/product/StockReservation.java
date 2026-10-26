package com.moonkage.vendor.product;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.Quantity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * One product's pieces held for one checkout. Its stock moves with it: holding or committing a released line takes
 * the pieces from the product, releasing a held line gives them back. The caller locks the product first.
 */
@Entity
@Table(name = "stock_reservations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class StockReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, updatable = false, length = 36)
    private String checkoutId;

    @Column(nullable = false, updatable = false, length = 36)
    private String productId;

    @Column(nullable = false, updatable = false)
    private Quantity qty;

    /** Fixed when held, VAT included: what the checkout charges per piece. */
    @Column(nullable = false, updatable = false)
    private Price unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status;

    /** Set by order-service, the one clock of the checkout (P-01). */
    @Column(nullable = false, updatable = false)
    private Instant expiresAt;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    /** Takes the pieces from {@code product}; it must be able to supply them. */
    static StockReservation hold(String checkoutId, Product product, Quantity qty, Instant expiresAt) {
        product.takeStock(qty.value());
        StockReservation reservation = new StockReservation();
        reservation.checkoutId = checkoutId;
        reservation.productId = product.getId();
        reservation.qty = qty;
        reservation.unitPrice = product.unitPriceFor(qty);
        reservation.status = ReservationStatus.HELD;
        reservation.expiresAt = expiresAt;
        return reservation;
    }

    /** Paid. A released line takes its pieces from {@code product} again; it must be able to supply them. */
    void commit(Product product) {
        if (status == ReservationStatus.RELEASED) {
            product.takeStock(qty.value());
        }
        moveTo(ReservationStatus.COMMITTED);
    }

    /** Not paid, or expired: the pieces go back to {@code product}. */
    void release(Product product) {
        moveTo(ReservationStatus.RELEASED);
        product.returnStock(qty.value());
    }

    /** Whether committing it needs the product's stock again. */
    boolean needsStockToCommit() {
        return status == ReservationStatus.RELEASED;
    }

    private void moveTo(ReservationStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        status = target;
    }
}
