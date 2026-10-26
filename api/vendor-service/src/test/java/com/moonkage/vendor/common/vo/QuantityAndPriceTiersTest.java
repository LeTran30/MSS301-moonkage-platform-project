package com.moonkage.vendor.common.vo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuantityAndPriceTiersTest {

    @Test
    void aQuantityIsMoreThanZero() {
        assertEquals(5, Quantity.of(5).value());
        assertError(ErrorCode.QUANTITY_INVALID, () -> new Quantity(0));
        assertError(ErrorCode.QUANTITY_INVALID, () -> Quantity.of(null));
    }

    @Test
    void tiersAreOrderedByWhereTheyStart() {
        PriceTiers tiers = PriceTiers.of(List.of(PriceTier.of(100, 90_000L), PriceTier.of(10, 95_000L)));

        assertEquals(10, tiers.tiers().getFirst().fromQty().value());
        assertEquals(100, tiers.tiers().getLast().fromQty().value());
    }

    @Test
    void twoTiersCannotStartAtTheSameQuantity() {
        assertError(
                ErrorCode.PRICE_TIERS_INVALID,
                () -> PriceTiers.of(List.of(PriceTier.of(10, 95_000L), PriceTier.of(10, 90_000L))));
    }

    @Test
    void theTierForAQuantityIsTheLastOneStartedBelowIt() {
        PriceTiers tiers = PriceTiers.of(List.of(PriceTier.of(10, 95_000L), PriceTier.of(100, 90_000L)));

        assertEquals(
                95_000L,
                tiers.tierFor(new Quantity(99)).orElseThrow().unitPrice().value());
        assertEquals(
                90_000L,
                tiers.tierFor(new Quantity(100)).orElseThrow().unitPrice().value());
        assertTrue(tiers.tierFor(new Quantity(9)).isEmpty());
    }

    private static void assertError(ErrorCode expected, Runnable creation) {
        AppException e = assertThrows(AppException.class, creation::run);
        assertEquals(expected, e.getErrorCode());
    }
}
