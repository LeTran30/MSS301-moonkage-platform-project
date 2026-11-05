package com.moonkage.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/**
 * The list of the codes every service answers a framework failure with.
 *
 * <p>It used to be written out again in each service's own {@code ErrorCode} enum, so the same code string existed
 * in five places and could drift apart. These tests pin the one list down: the code strings and the message keys are
 * a contract with the web and with the other services, so a change here is a change every service sees.
 */
class CommonErrorCodeTest {

    /** Every common code, with the string the services answer and the key its text is read from. */
    private static final Map<CommonErrorCode, String> EXPECTED_CODES = Map.ofEntries(
            Map.entry(CommonErrorCode.INTERNAL_SERVER_ERROR, "COMMON_500"),
            Map.entry(CommonErrorCode.INVALID_INPUT, "COMMON_400"),
            Map.entry(CommonErrorCode.MALFORMED_JSON, "COMMON_400_JSON"),
            Map.entry(CommonErrorCode.PARAMETER_REQUIRED, "COMMON_400_PARAM"),
            Map.entry(CommonErrorCode.UNAUTHENTICATED, "COMMON_401"),
            Map.entry(CommonErrorCode.ACCESS_DENIED, "COMMON_403"),
            Map.entry(CommonErrorCode.RESOURCE_NOT_FOUND, "COMMON_404"),
            Map.entry(CommonErrorCode.METHOD_NOT_ALLOWED, "COMMON_405"),
            Map.entry(CommonErrorCode.INVALID_STATE_TRANSITION, "COMMON_409"),
            Map.entry(CommonErrorCode.DEPENDENCY_UNAVAILABLE, "COMMON_503"),
            Map.entry(CommonErrorCode.FIELD_REQUIRED, "COMMON_400_REQUIRED"),
            Map.entry(CommonErrorCode.TEXT_TOO_LONG, "COMMON_400_TOO_LONG"),
            Map.entry(CommonErrorCode.PROVINCE_CODE_INVALID, "COMMON_400_PROVINCE"),
            Map.entry(CommonErrorCode.PRICE_INVALID, "COMMON_400_PRICE"),
            Map.entry(CommonErrorCode.QUANTITY_INVALID, "COMMON_400_QUANTITY"),
            Map.entry(CommonErrorCode.PRICE_TIERS_INVALID, "COMMON_400_PRICE_TIERS"),
            Map.entry(CommonErrorCode.NOT_IMPLEMENTED, "COMMON_501"));

    @Test
    void everyCommonCodeHasTheStringTheServicesAnswer() {
        assertThat(CommonErrorCode.values()).hasSize(EXPECTED_CODES.size());

        for (CommonErrorCode errorCode : CommonErrorCode.values()) {
            assertThat(errorCode.getCode())
                    .as("the code string of %s", errorCode)
                    .isEqualTo(EXPECTED_CODES.get(errorCode));
        }
    }

    @Test
    void everyCommonCodeHasTheKeyItsTextIsReadFrom() {
        Map<CommonErrorCode, String> expectedKeys = Map.ofEntries(
                Map.entry(CommonErrorCode.INTERNAL_SERVER_ERROR, "error.common.internal"),
                Map.entry(CommonErrorCode.INVALID_INPUT, "error.common.invalid_input"),
                Map.entry(CommonErrorCode.MALFORMED_JSON, "error.common.malformed_json"),
                Map.entry(CommonErrorCode.PARAMETER_REQUIRED, "error.common.parameter_required"),
                Map.entry(CommonErrorCode.UNAUTHENTICATED, "error.common.unauthenticated"),
                Map.entry(CommonErrorCode.ACCESS_DENIED, "error.common.access_denied"),
                Map.entry(CommonErrorCode.RESOURCE_NOT_FOUND, "error.common.resource_not_found"),
                Map.entry(CommonErrorCode.METHOD_NOT_ALLOWED, "error.common.method_not_allowed"),
                Map.entry(CommonErrorCode.INVALID_STATE_TRANSITION, "error.common.invalid_state_transition"),
                Map.entry(CommonErrorCode.DEPENDENCY_UNAVAILABLE, "error.common.dependency_unavailable"),
                Map.entry(CommonErrorCode.FIELD_REQUIRED, "error.common.field_required"),
                Map.entry(CommonErrorCode.TEXT_TOO_LONG, "error.common.text_too_long"),
                Map.entry(CommonErrorCode.PROVINCE_CODE_INVALID, "error.common.province_code_invalid"),
                Map.entry(CommonErrorCode.PRICE_INVALID, "error.common.price_invalid"),
                Map.entry(CommonErrorCode.QUANTITY_INVALID, "error.common.quantity_invalid"),
                Map.entry(CommonErrorCode.PRICE_TIERS_INVALID, "error.common.price_tiers_invalid"),
                Map.entry(CommonErrorCode.NOT_IMPLEMENTED, "error.common.not_implemented"));

        for (CommonErrorCode errorCode : CommonErrorCode.values()) {
            assertThat(errorCode.getMessageKey())
                    .as("the message key of %s", errorCode)
                    .isEqualTo(expectedKeys.get(errorCode));
        }
    }

    @Test
    void everyCommonCodeHasTheStatusItIsAnsweredWith() {
        Map<CommonErrorCode, HttpStatus> expectedStatuses = Map.ofEntries(
                Map.entry(CommonErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR),
                Map.entry(CommonErrorCode.INVALID_INPUT, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.MALFORMED_JSON, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.PARAMETER_REQUIRED, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.UNAUTHENTICATED, HttpStatus.UNAUTHORIZED),
                Map.entry(CommonErrorCode.ACCESS_DENIED, HttpStatus.FORBIDDEN),
                Map.entry(CommonErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND),
                Map.entry(CommonErrorCode.METHOD_NOT_ALLOWED, HttpStatus.METHOD_NOT_ALLOWED),
                Map.entry(CommonErrorCode.INVALID_STATE_TRANSITION, HttpStatus.CONFLICT),
                Map.entry(CommonErrorCode.DEPENDENCY_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE),
                Map.entry(CommonErrorCode.FIELD_REQUIRED, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.TEXT_TOO_LONG, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.PROVINCE_CODE_INVALID, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.PRICE_INVALID, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.QUANTITY_INVALID, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.PRICE_TIERS_INVALID, HttpStatus.BAD_REQUEST),
                Map.entry(CommonErrorCode.NOT_IMPLEMENTED, HttpStatus.NOT_IMPLEMENTED));

        for (CommonErrorCode errorCode : CommonErrorCode.values()) {
            assertThat(errorCode.getHttpStatus())
                    .as("the status of %s", errorCode)
                    .isEqualTo(expectedStatuses.get(errorCode));
        }
    }

    @Test
    void theCodeStringsAreTheOnesTheWebAlreadyReads() {
        // the web keys off these strings; renaming one is a change every service sees at once
        assertThat(CommonErrorCode.values())
                .extracting(CommonErrorCode::getCode)
                .contains("COMMON_400", "COMMON_401", "COMMON_404", "COMMON_409", "COMMON_500", "COMMON_503")
                .doesNotContainNull();
    }

    @Test
    void theCodeStringsAreUnique() {
        assertThat(java.util.Arrays.stream(CommonErrorCode.values())
                        .map(CommonErrorCode::getCode)
                        .collect(Collectors.toSet()))
                .hasSameSizeAs(CommonErrorCode.values());
    }
}
