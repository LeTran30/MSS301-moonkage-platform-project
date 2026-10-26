package com.moonkage.quotation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AgreementHasherTest {

    record Sample(String zeta, int alpha, LocalDate deliveryDate, Instant acceptedAt) {}

    @Test
    void writesKeysSortedAndDatesAsText() {
        String json = AgreementHasher.canonicalJson(
                new Sample("z", 1, LocalDate.parse("2026-11-20"), Instant.parse("2026-10-26T03:00:00Z")));

        assertThat(json)
                .isEqualTo("{\"acceptedAt\":\"2026-10-26T03:00:00Z\",\"alpha\":1,"
                        + "\"deliveryDate\":\"2026-11-20\",\"zeta\":\"z\"}");
    }

    @Test
    void sameContentGivesSameHashWhateverTheInsertionOrder() {
        Map<String, Object> first = new LinkedHashMap<>();
        first.put("b", 2);
        first.put("a", 1);
        Map<String, Object> second = new LinkedHashMap<>();
        second.put("a", 1);
        second.put("b", 2);

        String hash = AgreementHasher.sha256Hex(AgreementHasher.canonicalJson(first));

        assertThat(hash).hasSize(64).matches("[0-9a-f]+");
        assertThat(AgreementHasher.sha256Hex(AgreementHasher.canonicalJson(second)))
                .isEqualTo(hash);
    }
}
