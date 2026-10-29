package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.error.AppException;
import org.junit.jupiter.api.Test;

class CitizenIdTest {

    @Test
    void citizenIdValidatesAndMasksCorrectly() {
        CitizenId id = CitizenId.of("001098012345");
        assertEquals("001098012345", id.value());
        assertEquals("********2345", id.masked());
        assertEquals("001", id.provinceCode());
        assertEquals("********2345", id.toString());

        assertThrows(AppException.class, () -> CitizenId.of("12345"));
        assertThrows(AppException.class, () -> CitizenId.of("00109801234a"));
        assertThrows(AppException.class, () -> CitizenId.of(null));
    }
}
