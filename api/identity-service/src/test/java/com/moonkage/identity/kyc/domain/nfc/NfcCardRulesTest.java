package com.moonkage.identity.kyc.domain.nfc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** A-08: the server re-checks all 9 fields; each case breaks exactly one of a valid card. */
public class NfcCardRulesTest {

    public static final String ID_NUMBER = "079123456789";

    /** A card that passes every rule, expiring in 2046. */
    public static NfcCardFields validFields() {
        return fields(ID_NUMBER, "NGUYEN VAN A", "MALE", "1990-05-01", "2021-01-01", "2046-01-01");
    }

    public static NfcCardFields fields(
            String idNumber,
            String fullName,
            String gender,
            String dateOfBirth,
            String dateOfIssue,
            String dateOfExpiry) {
        return new NfcCardFields(
                idNumber,
                fullName,
                gender,
                "VIET NAM",
                dateOfBirth,
                "HA NOI",
                "QUAN 1, TP HO CHI MINH",
                dateOfIssue,
                dateOfExpiry);
    }

    @Test
    void validCardKeepsOnlyWhatIsStored() {
        NfcCard card = NfcCardRules.read(validFields()).orElseThrow();

        assertEquals(ID_NUMBER, card.idNumber().value());
        assertEquals("NGUYEN VAN A", card.legalName().value());
        assertEquals(LocalDate.of(2046, 1, 1), card.dateOfExpiry());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"07912345678", "0791234567890", "07912345678a", " 79123456789"})
    void idNumberMustBe12Digits(String idNumber) {
        assertBad(fields(idNumber, "NGUYEN VAN A", "MALE", "1990-05-01", "2021-01-01", "2046-01-01"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Nguyen Van A", "NGUYỄN VĂN A", "NGUYEN  VAN A", " NGUYEN VAN A", "NGUYEN VAN A1"})
    void nameMustBeUpperCaseWithoutDiacritics(String fullName) {
        assertBad(fields(ID_NUMBER, fullName, "MALE", "1990-05-01", "2021-01-01", "2046-01-01"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Nam", "Nu", "male", "OTHER"})
    void genderMustBeMaleOrFemale(String gender) {
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", gender, "1990-05-01", "2021-01-01", "2046-01-01"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"2021-02-30", "2021-13-01", "01/01/2021", "2021-1-1"})
    void datesMustBeRealYyyyMmDd(String date) {
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", "MALE", "1990-05-01", date, "2046-01-01"));
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", "MALE", date, "2021-01-01", "2046-01-01"));
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", "MALE", "1990-05-01", "2021-01-01", date));
    }

    @Test
    void issueDateMustBeAfterBirth() {
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", "MALE", "1990-05-01", "1990-05-01", "2046-01-01"));
    }

    @Test
    void expiryMustBeAfterIssue() {
        assertBad(fields(ID_NUMBER, "NGUYEN VAN A", "MALE", "1990-05-01", "2021-01-01", "2021-01-01"));
    }

    @Test
    void textFieldsMustNotBeBlankNorTooLong() {
        NfcCardFields valid = validFields();
        assertBad(new NfcCardFields(
                ID_NUMBER, "NGUYEN VAN A", "MALE", " ", "1990-05-01", "HA NOI", "Q1", "2021-01-01", "2046-01-01"));
        assertBad(new NfcCardFields(
                ID_NUMBER, "NGUYEN VAN A", "MALE", "VIET NAM", "1990-05-01", null, "Q1", "2021-01-01", "2046-01-01"));
        assertBad(new NfcCardFields(
                ID_NUMBER, "NGUYEN VAN A", "MALE", "VIET NAM", "1990-05-01", "HA NOI", "", "2021-01-01", "2046-01-01"));
        assertBad(new NfcCardFields(
                ID_NUMBER,
                "NGUYEN VAN A",
                "MALE",
                "x".repeat(51),
                "1990-05-01",
                "HA NOI",
                "Q1",
                "2021-01-01",
                "2046-01-01"));
        assertTrue(NfcCardRules.read(valid).isPresent());
    }

    @Test
    void cardIsValidThroughItsExpiryDayInVietnam() {
        NfcCard card = NfcCardRules.read(validFields()).orElseThrow();

        // 2046-01-01 23:59 in Vietnam is 16:59 UTC; one minute later it is the 2nd there
        assertFalse(card.isExpiredAt(Instant.parse("2046-01-01T16:59:00Z")));
        assertTrue(card.isExpiredAt(Instant.parse("2046-01-01T17:00:00Z")));
    }

    private static void assertBad(NfcCardFields fields) {
        assertTrue(NfcCardRules.read(fields).isEmpty(), fields::toString);
    }
}
