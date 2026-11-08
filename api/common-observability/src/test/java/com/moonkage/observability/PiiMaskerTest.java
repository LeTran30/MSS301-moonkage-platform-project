package com.moonkage.observability;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * NFR-03: the log keeps enough to tell two callers apart and not enough to identify one.
 */
class PiiMaskerTest {

    @Test
    void anEmailKeepsItsFirstAndLastLocalCharacterAndItsDomain() {
        assertThat(PiiMasker.maskEmail("lien@example.com")).isEqualTo("l***n@example.com");
    }

    @Test
    void anEmailWithOneLocalCharacterIsHiddenCompletely() {
        assertThat(PiiMasker.maskEmail("a@example.com")).isEqualTo("***");
    }

    @Test
    void aValueWithoutAnAtSignIsHiddenCompletely() {
        assertThat(PiiMasker.maskEmail("not-an-email")).isEqualTo("***");
    }

    @Test
    void anEmptyEmailIsEmpty() {
        assertThat(PiiMasker.maskEmail(null)).isEmpty();
        assertThat(PiiMasker.maskEmail("  ")).isEmpty();
    }

    @Test
    void aPhoneKeepsItsFirstAndLastThreeDigits() {
        assertThat(PiiMasker.maskPhone("0912345678")).isEqualTo("091****678");
    }

    @Test
    void aPhoneWithSeparatorsIsMaskedOnItsDigits() {
        assertThat(PiiMasker.maskPhone("091-234-5678")).isEqualTo("091****678");
    }

    @Test
    void aTooShortPhoneIsHiddenCompletely() {
        assertThat(PiiMasker.maskPhone("12345")).isEqualTo("***");
    }

    @Test
    void anEmptyPhoneIsEmpty() {
        assertThat(PiiMasker.maskPhone(null)).isEmpty();
    }
}
