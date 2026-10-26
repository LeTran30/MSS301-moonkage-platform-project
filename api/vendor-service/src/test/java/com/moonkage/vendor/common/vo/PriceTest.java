package com.moonkage.vendor.common.vo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PriceTest {

    @Test
    void aPositiveAmountIsAPrice() {
        assertEquals(200_000L, Price.of(200_000L).value());
    }

    @ParameterizedTest
    @ValueSource(longs = {0, -1})
    void zeroOrLessIsNotAPrice(long amount) {
        AppException e = assertThrows(AppException.class, () -> new Price(amount));
        assertEquals(ErrorCode.PRICE_INVALID, e.getErrorCode());
    }

    @Test
    void aMissingAmountIsNotAPrice() {
        AppException e = assertThrows(AppException.class, () -> Price.of(null));
        assertEquals(ErrorCode.PRICE_INVALID, e.getErrorCode());
    }
}
