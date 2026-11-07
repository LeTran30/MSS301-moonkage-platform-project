package com.moonkage.vendor.vendor.vo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;

/** FR-28: where a vendor delivers, and for how much. */
class DeliverySettingsTest {

    @Test
    void deliveryAreasAreKnownProvincesEachOnceInCodeOrder() {
        assertEquals(
                List.of("01", "79"),
                DeliveryAreas.of(List.of("79", " 01", "79")).codes());
    }

    @Test
    void deliveryAreasNeedAtLeastOneKnownProvince() {
        assertError(ErrorCode.DELIVERY_AREAS_INVALID, () -> DeliveryAreas.of(List.of()));
        assertError(ErrorCode.DELIVERY_AREAS_INVALID, () -> DeliveryAreas.of(null));
        assertError(ErrorCode.PROVINCE_CODE_INVALID, () -> DeliveryAreas.of(List.of("01", "99")));
    }

    @Test
    void aDeliveryFeeIsZeroOrMore() {
        assertEquals(0, DeliveryFee.of(0L).value());
        assertError(ErrorCode.DELIVERY_FEE_INVALID, () -> DeliveryFee.of(-1L));
        assertError(ErrorCode.DELIVERY_FEE_INVALID, () -> DeliveryFee.of(null));
    }

    private static void assertError(ErrorCode expected, Runnable creation) {
        AppException e = assertThrows(AppException.class, creation::run);
        assertEquals(expected, e.getErrorCode());
    }
}
