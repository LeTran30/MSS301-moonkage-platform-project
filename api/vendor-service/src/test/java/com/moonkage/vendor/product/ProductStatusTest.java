package com.moonkage.vendor.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.EnumSet;
import org.junit.jupiter.api.Test;

/** Requirement 7.1: hide and show by the Shop, removal by an admin for good (FR-34, BR-24). */
class ProductStatusTest {

    @Test
    void aShopHidesAndShowsAndAnAdminRemoves() {
        assertTrue(ProductStatus.ON_SALE.canTransitionTo(ProductStatus.HIDDEN));
        assertTrue(ProductStatus.HIDDEN.canTransitionTo(ProductStatus.ON_SALE));
        assertTrue(ProductStatus.ON_SALE.canTransitionTo(ProductStatus.REMOVED));
        assertTrue(ProductStatus.HIDDEN.canTransitionTo(ProductStatus.REMOVED));
    }

    @Test
    void nothingComesBackFromRemovedNorMovesToItself() {
        for (ProductStatus target : EnumSet.allOf(ProductStatus.class)) {
            assertFalse(ProductStatus.REMOVED.canTransitionTo(target));
        }
        assertEquals(
                0,
                EnumSet.allOf(ProductStatus.class).stream()
                        .filter(status -> status.canTransitionTo(status))
                        .count());
    }
}
