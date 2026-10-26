package com.moonkage.vendor.cakeattribute;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** AC-54.1, AC-54.2: the code and the comparison key come from the label through one diacritics function. */
class CakeAttributeLabelTest {

    @ParameterizedTest
    @CsvSource({
        "Bánh nướng, banh nuong, banh-nuong",
        "Đậu đỏ, dau do, dau-do",
        "Trứng muối, trung muoi, trung-muoi",
        "'  Sầu   riêng ', sau rieng, sau-rieng",
        "Nhân 2 trứng, nhan 2 trung, nhan-2-trung",
        "Bánh-nướng (mới), banh-nuong (moi), banh-nuong-moi"
    })
    void theKeyAndTheCodeDropDiacriticsCaseAndExtraSpaces(String label, String key, String code) {
        CakeAttributeLabel value = CakeAttributeLabel.of(label);

        assertEquals(key, value.key());
        assertEquals(code, value.toCode().value());
    }

    @Test
    void aComposedAndADecomposedLabelAreTheSameLabel() {
        // "ư" + combining hook above, as some keyboards type it, against the composed "ử"
        CakeAttributeLabel decomposed = CakeAttributeLabel.of("Thử");
        CakeAttributeLabel composed = CakeAttributeLabel.of("Thử");

        assertEquals(composed, decomposed);
    }

    @Test
    void theLabelKeepsItsCaseAndDiacritics() {
        assertEquals("Đậu xanh", CakeAttributeLabel.of(" Đậu  xanh ").value());
    }

    @Test
    void aLabelNeedsALetterOrDigitAndFitsTheCode() {
        assertError(ErrorCode.CAKE_ATTRIBUTE_LABEL_INVALID, () -> CakeAttributeLabel.of(null));
        assertError(ErrorCode.CAKE_ATTRIBUTE_LABEL_INVALID, () -> CakeAttributeLabel.of("   "));
        assertError(ErrorCode.CAKE_ATTRIBUTE_LABEL_INVALID, () -> CakeAttributeLabel.of("-- ** --"));
        assertError(
                ErrorCode.CAKE_ATTRIBUTE_LABEL_INVALID,
                () -> CakeAttributeLabel.of("a".repeat(CakeAttributeLabel.MAX_LENGTH + 1)));
    }

    @Test
    void aCodeFromARequestHasTheCodeFormat() {
        assertEquals("dau-xanh", CakeAttributeCode.of(" dau-xanh ").value());
        assertError(ErrorCode.CAKE_ATTRIBUTE_CODE_INVALID, () -> CakeAttributeCode.of("Dau-xanh"));
        assertError(ErrorCode.CAKE_ATTRIBUTE_CODE_INVALID, () -> CakeAttributeCode.of("dau--xanh"));
        assertError(ErrorCode.CAKE_ATTRIBUTE_CODE_INVALID, () -> CakeAttributeCode.of("đậu-xanh"));
        assertError(ErrorCode.CAKE_ATTRIBUTE_CODE_INVALID, () -> CakeAttributeCode.of(null));
    }

    private static void assertError(ErrorCode expected, Runnable creation) {
        AppException e = assertThrows(AppException.class, creation::run);
        assertEquals(expected, e.getErrorCode());
    }
}
