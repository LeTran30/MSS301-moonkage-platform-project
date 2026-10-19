package com.moonkage.identity.nfc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.enums.Gender;
import com.moonkage.identity.nfc.NfcCardValidator.NfcCard;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** A-08: the server re-checks all 9 fields; each case breaks exactly one of a valid card. */
class NfcCardValidatorTest {

    static final String ID_NUMBER = "079123456789";

    static SubmitCardRequest validRequest() {
        return request("NGUYEN VAN A", "MALE", "2021-01-01", "2046-01-01");
    }

    static SubmitCardRequest request(String fullName, String sex, String dateOfIssue, String dateOfExpiry) {
        return new SubmitCardRequest(fullName, sex, "VIET NAM", "HA NOI", dateOfIssue, dateOfExpiry, "jwe", "1.0.0");
    }

    static Map<String, Object> validFields() {
        Map<String, Object> fields = new HashMap<>();
        fields.put("idNumber", ID_NUMBER);
        fields.put("dateOfBirth", "1990-05-01");
        fields.put("placeOfResidence", "QUAN 1, TP HO CHI MINH");
        return fields;
    }

    @Test
    void validCardKeepsOnlyWhatIsStored() {
        NfcCard card = NfcCardValidator.validate(validRequest(), validFields()).orElseThrow();

        assertEquals(ID_NUMBER, card.idNumber());
        assertEquals("NGUYEN VAN A", card.legalName());
        assertEquals(Gender.MALE, card.gender());
        assertEquals("VIET NAM", card.nationality());
        assertEquals(LocalDate.of(1990, 5, 1), card.dateOfBirth());
        assertEquals(LocalDate.of(2046, 1, 1), card.dateOfExpiry());
    }

    @ParameterizedTest
    @ValueSource(strings = {"07912345678", "0791234567890", "07912345678a", " 79123456789"})
    void idNumberMustBe12Digits(String idNumber) {
        Map<String, Object> fields = validFields();
        fields.put("idNumber", idNumber);

        assertTrue(NfcCardValidator.validate(validRequest(), fields).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Nguyen Van A", "NGUYỄN VĂN A", "NGUYEN  VAN A", " NGUYEN VAN A", "NGUYEN VAN A1", ""})
    void nameMustBeUpperCaseWithoutDiacritics(String fullName) {
        assertTrue(NfcCardValidator.validate(request(fullName, "MALE", "2021-01-01", "2046-01-01"), validFields())
                .isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Nam", "Nu", "male", "OTHER"})
    void sexMustBeMaleOrFemale(String sex) {
        assertTrue(NfcCardValidator.validate(request("NGUYEN VAN A", sex, "2021-01-01", "2046-01-01"), validFields())
                .isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"2021-02-30", "2021-13-01", "01/01/2021", "2021-1-1"})
    void datesMustBeRealYyyyMmDd(String dateOfIssue) {
        assertTrue(NfcCardValidator.validate(request("NGUYEN VAN A", "MALE", dateOfIssue, "2046-01-01"), validFields())
                .isEmpty());
    }

    @Test
    void issueDateMustBeAfterBirth() {
        assertTrue(NfcCardValidator.validate(request("NGUYEN VAN A", "MALE", "1990-05-01", "2046-01-01"), validFields())
                .isEmpty());
    }

    @Test
    void expiryMustBeAfterIssue() {
        assertTrue(NfcCardValidator.validate(request("NGUYEN VAN A", "MALE", "2021-01-01", "2021-01-01"), validFields())
                .isEmpty());
    }

    @Test
    void encryptedFieldsMustAllBeStrings() {
        for (String key : validFields().keySet()) {
            Map<String, Object> missing = validFields();
            missing.remove(key);
            Map<String, Object> notString = validFields();
            notString.put(key, 79123456789L);

            assertTrue(NfcCardValidator.validate(validRequest(), missing).isEmpty(), key);
            assertTrue(NfcCardValidator.validate(validRequest(), notString).isEmpty(), key);
        }
    }

    @Test
    void textFieldsMustNotBeBlank() {
        SubmitCardRequest blankNationality =
                new SubmitCardRequest("NGUYEN VAN A", "MALE", " ", "HA NOI", "2021-01-01", "2046-01-01", "jwe", "1");
        SubmitCardRequest noPlaceOfBirth =
                new SubmitCardRequest("NGUYEN VAN A", "MALE", "VIET NAM", null, "2021-01-01", "2046-01-01", "jwe", "1");
        Map<String, Object> blankResidence = validFields();
        blankResidence.put("placeOfResidence", "");

        assertTrue(NfcCardValidator.validate(blankNationality, validFields()).isEmpty());
        assertTrue(NfcCardValidator.validate(noPlaceOfBirth, validFields()).isEmpty());
        assertTrue(NfcCardValidator.validate(validRequest(), blankResidence).isEmpty());
    }
}
