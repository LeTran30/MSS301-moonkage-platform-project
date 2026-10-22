package com.moonkage.reference;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class ProvinceTest {

    /** catalog-service's copy of the list; Maven runs tests from the module folder. */
    private static final Path CATALOG_ROWS =
            Path.of("..", "catalog-service", "src", "main", "resources", "db", "migration", "R__provinces.sql");

    private static final Pattern ROW = Pattern.compile("\\('(\\d{2})', '([^']+)'\\)");

    @Test
    void listHasTheThirtyFourUnitsWithUniqueTwoDigitCodes() {
        assertThat(Province.values()).hasSize(34);
        assertThat(Arrays.stream(Province.values()).map(Province::getCode))
                .doesNotHaveDuplicates()
                .allMatch(code -> code.matches("\\d{2}"));
    }

    @Test
    void findsByCode() {
        assertThat(Province.fromCode("79")).contains(Province.HO_CHI_MINH);
        assertThat(Province.HO_CHI_MINH.getOfficialName()).isEqualTo("Thành phố Hồ Chí Minh");
        assertThat(Province.isKnown("01")).isTrue();
        // a code of a province merged on 01/07/2025 (Bình Dương)
        assertThat(Province.isKnown("74")).isFalse();
        assertThat(Province.isKnown(null)).isFalse();
    }

    @Test
    void catalogTableHasTheSameRows() throws IOException {
        String sql = Files.readString(CATALOG_ROWS, StandardCharsets.UTF_8);
        Matcher matcher = ROW.matcher(sql);
        Map<String, String> rows = new HashMap<>();
        while (matcher.find()) {
            rows.put(matcher.group(1), matcher.group(2));
        }
        Map<String, String> expected = Arrays.stream(Province.values())
                .collect(Collectors.toMap(Province::getCode, Province::getOfficialName));
        assertThat(rows).isEqualTo(expected);
    }
}
