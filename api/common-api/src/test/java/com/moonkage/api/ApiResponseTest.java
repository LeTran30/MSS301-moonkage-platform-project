package com.moonkage.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

/** The envelope every service answers with must be byte-identical, so the web reads it the same way everywhere. */
class ApiResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void aSuccessCarriesTheSuccessCodeAndThePayload() {
        ApiResponse<String> response = ApiResponse.ok("payload");

        assertThat(response.status()).isEqualTo(200);
        assertThat(response.code()).isEqualTo(ApiResponse.SUCCESS_CODE);
        assertThat(response.message()).isEqualTo(ApiResponse.SUCCESS_MESSAGE);
        assertThat(response.data()).isEqualTo("payload");
        assertThat(response.errors()).isNull();
        assertThat(response.path()).isNull();
        assertThat(response.timestamp()).isNotNull();
    }

    @Test
    void aSuccessWithoutAPayloadStillCarriesTheEnvelope() {
        ApiResponse<Void> response = ApiResponse.ok();

        assertThat(response.status()).isEqualTo(200);
        assertThat(response.code()).isEqualTo(ApiResponse.SUCCESS_CODE);
        assertThat(response.data()).isNull();
    }

    @Test
    void aCreatedResourceAnswersWith201() {
        assertThat(ApiResponse.created("payload").status()).isEqualTo(201);
    }

    @Test
    void anErrorCarriesTheCodeThePathAndNoData() {
        ApiResponse<Void> response = ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy", "/api/things");

        assertThat(response.status()).isEqualTo(404);
        assertThat(response.code()).isEqualTo("NOT_FOUND");
        assertThat(response.message()).isEqualTo("Không tìm thấy");
        assertThat(response.data()).isNull();
        assertThat(response.path()).isEqualTo("/api/things");
    }

    @Test
    void anErrorCanNameTheInvalidFields() {
        ApiResponse<Void> response = ApiResponse.error(
                400,
                "COMMON_400",
                "Dữ liệu không hợp lệ",
                List.of(new ApiResponse.FieldError("email", "Email không đúng định dạng")),
                "/api/things");

        assertThat(response.errors())
                .containsExactly(new ApiResponse.FieldError("email", "Email không đúng định dạng"));
    }

    @Test
    void theEnvelopeNeverWritesTheEmptyOptionalParts() throws Exception {
        String json = objectMapper.writeValueAsString(ApiResponse.ok("payload"));

        assertThat(json).contains("\"status\":200").contains("\"code\":\"SUCCESS\"");
        assertThat(json).doesNotContain("errors").doesNotContain("path");
    }

    @Test
    void aPageCarriesItsContentAndItsCounters() {
        PageResponse<String> page = PageResponse.from(new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 2), 7));

        assertThat(page.content()).containsExactly("a", "b");
        assertThat(page.page()).isEqualTo(1);
        assertThat(page.size()).isEqualTo(2);
        assertThat(page.totalElements()).isEqualTo(7);
        assertThat(page.totalPages()).isEqualTo(4);
    }
}
