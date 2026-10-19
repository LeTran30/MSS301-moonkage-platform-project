package com.moonkage.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class FileSignaturesTest {

    @Test
    void recognisesEachSupportedType() {
        assertThat(FileSignatures.hasSignature("image/jpeg", bytes(0xFF, 0xD8, 0xFF, 0xE0)))
                .isTrue();
        assertThat(FileSignatures.hasSignature("image/png", bytes(0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0)))
                .isTrue();
        assertThat(FileSignatures.hasSignature("image/webp", ascii("RIFF\0\0\0\0WEBPVP8 ")))
                .isTrue();
        assertThat(FileSignatures.hasSignature("application/pdf", ascii("%PDF-1.7\n")))
                .isTrue();
    }

    @Test
    void refusesContentOfAnotherTypeOrTooShort() {
        assertThat(FileSignatures.hasSignature("image/png", ascii("<html><script>alert(1)</script>")))
                .isFalse();
        assertThat(FileSignatures.hasSignature("image/jpeg", ascii("%PDF-1.7"))).isFalse();
        assertThat(FileSignatures.hasSignature("image/webp", ascii("RIFF\0\0\0\0WAVEfmt ")))
                .isFalse();
        assertThat(FileSignatures.hasSignature("image/png", bytes(0x89, 'P'))).isFalse();
        assertThat(FileSignatures.hasSignature("text/html", ascii("<html>"))).isFalse();
    }

    private static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.ISO_8859_1);
    }

    private static byte[] bytes(int... values) {
        byte[] result = new byte[values.length];
        for (int i = 0; i < values.length; i++) {
            result[i] = (byte) values[i];
        }
        return result;
    }
}
