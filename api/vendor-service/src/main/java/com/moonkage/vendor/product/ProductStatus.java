package com.moonkage.vendor.product;

/** Requirement 7.1: a product is on sale or hidden by its Shop, or removed by an admin for good (BR-24). */
public enum ProductStatus {
    ON_SALE,
    HIDDEN,
    REMOVED;

    /** The Shop hides and shows again (FR-34); an admin removes (FR-46); nothing comes back from REMOVED. */
    public boolean canTransitionTo(ProductStatus target) {
        return switch (this) {
            case ON_SALE -> target == HIDDEN || target == REMOVED;
            case HIDDEN -> target == ON_SALE || target == REMOVED;
            case REMOVED -> false;
        };
    }
}
