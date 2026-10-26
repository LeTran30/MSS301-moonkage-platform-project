package com.moonkage.quotation.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.CustomType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuoteTermsTest {

    private static final LocalDate DELIVERY = LocalDate.parse("2026-11-20");
    private static final Instant VALID_UNTIL = Instant.parse("2026-11-02T03:00:00Z");

    @Test
    void totalIncludesProductsCustomWorkAndShipping() {
        QuoteTerms terms = compute(
                List.of(
                        QuoteItem.product("Hộp 4 bánh", null, 100, 120_000),
                        QuoteItem.custom(CustomType.BAG, "In logo túi", 100, 5_000)),
                30_000,
                "30");

        assertThat(terms.itemsAmount()).isEqualTo(12_000_000);
        assertThat(terms.customSurcharge()).isEqualTo(500_000);
        assertThat(terms.totalAmount()).isEqualTo(12_530_000);
        assertThat(terms.depositAmount()).isEqualTo(3_759_000);
        assertThat(terms.remainingAmount()).isEqualTo(8_771_000);
        assertThat(terms.depositRate()).isEqualByComparingTo("30.00");
    }

    @Test
    void depositRoundsDownToTheDong() {
        QuoteTerms terms = compute(List.of(QuoteItem.product("Bánh", null, 1, 99_999)), 0, "33.33");

        // 99.999 × 33,33% = 33.329,6667đ
        assertThat(terms.depositAmount()).isEqualTo(33_329);
        assertThat(terms.remainingAmount()).isEqualTo(66_670);
    }

    @Test
    void rateWithTrailingZerosBeyondTwoDecimalsIsAccepted() {
        QuoteTerms terms = compute(List.of(QuoteItem.product("Bánh", null, 10, 10_000)), 0, "50.000");

        assertThat(terms.depositAmount()).isEqualTo(50_000);
    }

    @Test
    void rejectsQuoteWithoutProductLine() {
        List<QuoteItem> onlyCustom = List.of(QuoteItem.custom(CustomType.CARD, "Thiệp", 10, 2_000));

        assertThatThrownBy(() -> compute(onlyCustom, 0, "30"))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_QUOTE_LINES);
    }

    @Test
    void rejectsRateOutOfRangeOrTooPrecise() {
        List<QuoteItem> items = List.of(QuoteItem.product("Bánh", null, 10, 10_000));

        for (String rate : List.of("0", "-5", "100.01", "30.125")) {
            assertThatThrownBy(() -> compute(items, 0, rate))
                    .as("rate %s", rate)
                    .isInstanceOf(AppException.class)
                    .extracting(e -> ((AppException) e).getErrorCode())
                    .isEqualTo(ErrorCode.INVALID_DEPOSIT);
        }
    }

    @Test
    void rejectsDepositThatRoundsToZero() {
        List<QuoteItem> free = List.of(QuoteItem.product("Bánh tặng", null, 1, 0));

        assertThatThrownBy(() -> compute(free, 0, "30"))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_DEPOSIT);
    }

    private static QuoteTerms compute(List<QuoteItem> items, long shippingFee, String rate) {
        return QuoteTerms.compute(
                items, shippingFee, new BigDecimal(rate), DELIVERY, "Giao tận nơi", VALID_UNTIL, null);
    }
}
