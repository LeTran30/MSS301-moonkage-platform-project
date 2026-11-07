package com.moonkage.vendor.vendor.vo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.ProvinceCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Each value object normalizes what it accepts and refuses the rest with its own error code. */
class ValueObjectTest {

    @ParameterizedTest
    @ValueSource(strings = {"0312345678", "0312345678-001", "001234567890", " 0312 345 678 "})
    void aTaxCodeOfTenDigitsABranchSuffixOrTwelveDigitsIsAccepted(String raw) {
        assertTrue(TaxCode.of(raw).value().matches("[\\d-]+"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"031234567", "0312345678-01", "03123456789", "abcdefghij"})
    void anyOtherTaxCodeIsRefused(String raw) {
        assertError(ErrorCode.TAX_CODE_INVALID, () -> TaxCode.of(raw));
    }

    @Test
    void aRepresentativeNameIsUpperCasedWithSingleSpaces() {
        assertEquals(
                "PHAM VAN BANH", RepresentativeName.of("  pham   van  banh ").value());
    }

    @Test
    void aRepresentativeNameWithDiacriticsIsRefused() {
        assertError(ErrorCode.REPRESENTATIVE_NAME_INVALID, () -> RepresentativeName.of("Phạm Văn Bánh"));
    }

    @Test
    void aRepresentativeNameLongerThanTheColumnIsRefused() {
        assertError(
                ErrorCode.REPRESENTATIVE_NAME_INVALID,
                () -> RepresentativeName.of("A".repeat(RepresentativeName.MAX_LENGTH + 1)));
    }

    @Test
    void theNameOnTheCardMatchesOnceDiacriticsAndDStrokeAreStripped() {
        RepresentativeName name = RepresentativeName.of("DANG THI DUNG");

        assertTrue(name.matches("ĐẶNG THỊ  DUNG"));
        assertFalse(name.matches("ĐẶNG THỊ DUNG ANH"));
        assertFalse(name.matches(null));
    }

    @Test
    void anIdNumberIsTwelveDigitsAndNeverPrinted() {
        IdNumber idNumber = IdNumber.of(" 079200001234 ");

        assertEquals("079200001234", idNumber.value());
        assertFalse(idNumber.toString().contains("1234"));
        assertError(ErrorCode.ID_NUMBER_INVALID, () -> IdNumber.of("07920000123"));
    }

    @Test
    void aBankAccountNumberDropsSeparatorsAndPrintsOnlyItsMaskedForm() {
        BankAccountNumber number = BankAccountNumber.of("0123 456.789");

        assertEquals("0123456789", number.value());
        assertEquals("******6789", number.masked());
        assertEquals(number.masked(), number.toString());
        assertError(ErrorCode.BANK_ACCOUNT_NUMBER_INVALID, () -> BankAccountNumber.of("12345"));
        assertError(
                ErrorCode.BANK_ACCOUNT_NUMBER_INVALID,
                () -> BankAccountNumber.of("1".repeat(BankAccountNumber.MAX_DIGITS + 1)));
    }

    @Test
    void aProvinceCodeMustBeAKnownProvince() {
        assertEquals("79", ProvinceCode.of(" 79 ").value());
        assertError(ErrorCode.PROVINCE_CODE_INVALID, () -> ProvinceCode.of("99"));
    }

    private static void assertError(ErrorCode expected, Runnable creation) {
        AppException e = assertThrows(AppException.class, creation::run);
        assertEquals(expected, e.getErrorCode());
    }
}
