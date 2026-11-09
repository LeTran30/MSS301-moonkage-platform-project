package com.moonkage.api;

import static org.assertj.core.api.Assertions.assertThat;

import feign.FeignException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * The shared error boundary: the framework failures that mean the same thing in every service.
 *
 * <p>These handlers were written out again in each service's own advice, which meant seven copies to keep in step
 * (audit findings H-02 and H-03). They live in {@link CommonExceptionHandler} now, and these tests pin down what a
 * caller reads: the status, the {@code COMMON_*} code string and the fact that no data comes with a failure.
 */
class CommonExceptionHandlerTest {

    private CommonExceptionHandler handler;

    @BeforeEach
    void setUp() {
        // no message bundle: the shared class falls back to its own wording
        handler = new CommonExceptionHandler(null);
    }

    @Test
    void aFieldThatIsNotValidIsABadRequestNamingEveryWrongField() {
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "quoteRequest");
        bindingResult.addError(new FieldError("quoteRequest", "quantity", "Số lượng phải lớn hơn 0"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleValidationException(ex, request("POST", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_400");
        assertThat(body.data()).isNull();
        assertThat(body.errors()).containsExactly(new ApiResponse.FieldError("quantity", "Số lượng phải lớn hơn 0"));
        assertThat(body.path()).isEqualTo("/api/quote-requests");
    }

    @Test
    void aBodyThatCannotBeReadIsABadRequest() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("body is not JSON");

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleUnreadable(ex, request("POST", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_400_JSON");
        assertThat(body.data()).isNull();
        assertThat(body.errors()).isNull();
    }

    @Test
    void aMissingQueryParameterIsABadRequestNamingTheParameter() {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("provinceCode", "String");

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleMissingParameter(ex, request("GET", "/api/suppliers"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_400_PARAM");
        assertThat(body.data()).isNull();
        assertThat(body.errors()).extracting(ApiResponse.FieldError::field).containsExactly("provinceCode");
        assertThat(body.message()).contains("provinceCode");
    }

    @Test
    void aPathNothingServesIsNotFound() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/api/unknown");

        ResponseEntity<ApiResponse<Void>> response = handler.handleNoResource(ex, request("GET", "/api/unknown"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_404");
        assertThat(body.data()).isNull();
    }

    @Test
    void aPathWithoutAHandlerIsNotFoundToo() {
        NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/api/unknown", HttpHeaders.EMPTY);

        ResponseEntity<ApiResponse<Void>> response = handler.handleNoResource(ex, request("GET", "/api/unknown"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("COMMON_404");
    }

    @Test
    void aMethodThePathDoesNotServeIsNotAllowed() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("DELETE");

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleMethodNotSupported(ex, request("DELETE", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(405);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_405");
        assertThat(body.data()).isNull();
    }

    @Test
    void aCallToAnotherServiceThatFailedIsUnavailable() {
        FeignException ex = FeignException.errorStatus(
                "GET",
                feign.Response.builder()
                        .status(500)
                        .reason("Internal Server Error")
                        .request(feign.Request.create(
                                feign.Request.HttpMethod.GET,
                                "/internal/things",
                                java.util.Map.of(),
                                (byte[]) null,
                                java.nio.charset.StandardCharsets.UTF_8))
                        .build());

        ResponseEntity<ApiResponse<Void>> response = handler.handleFeign(ex, request("GET", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(503);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_503");
        assertThat(body.data()).isNull();
    }

    @Test
    void aFailureNobodyExpectedIsAServerErrorThatTellsNothing() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleUncaughtException(new RuntimeException("boom"), request("GET", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_500");
        assertThat(body.data()).isNull();
        // the answer must not carry the detail of the failure
        assertThat(body.message()).doesNotContain("boom");
    }

    @Test
    void everyAnswerCarriesTheSameEnvelope() {
        List<ResponseEntity<ApiResponse<Void>>> answers = List.of(
                handler.handleUnreadable(new HttpMessageNotReadableException("x"), request("POST", "/api/x")),
                handler.handleNoResource(
                        new NoResourceFoundException(HttpMethod.GET, "/api/x"), request("GET", "/api/x")),
                handler.handleMethodNotSupported(
                        new HttpRequestMethodNotSupportedException("DELETE"), request("DELETE", "/api/x")),
                handler.handleUncaughtException(new RuntimeException("boom"), request("GET", "/api/x")));

        for (ResponseEntity<ApiResponse<Void>> answer : answers) {
            ApiResponse<Void> body = answer.getBody();
            assertThat(body).isNotNull();
            assertThat(body.status()).isEqualTo(answer.getStatusCode().value());
            assertThat(body.data()).isNull();
            assertThat(body.path()).isEqualTo("/api/x");
            assertThat(body.timestamp()).isNotNull();
        }
    }

    @Test
    void theCodeStringsAreTheSharedOnes() {
        assertThat(handler.handleUncaughtException(new RuntimeException("boom"), request("GET", "/api/x"))
                        .getBody()
                        .code())
                .isEqualTo("COMMON_500");
        assertThat(handler.handleNoResource(
                                new NoResourceFoundException(HttpMethod.GET, "/api/x"), request("GET", "/api/x"))
                        .getBody()
                        .code())
                .isEqualTo("COMMON_404");
    }

    @Test
    void aServiceCanAnswerOneOfThemItsOwnWay() {
        // the hooks are the way a service keeps its own wording and its own code strings
        CommonExceptionHandler custom = new CommonExceptionHandler(null) {
            @Override
            protected String code(CommonErrorCode errorCode) {
                return "OWN_" + errorCode.name();
            }

            @Override
            protected HttpStatus status(CommonErrorCode errorCode) {
                return HttpStatus.I_AM_A_TEAPOT;
            }
        };

        ResponseEntity<ApiResponse<Void>> response =
                custom.handleUncaughtException(new RuntimeException("boom"), request("GET", "/api/x"));

        assertThat(response.getStatusCode().value()).isEqualTo(418);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("OWN_INTERNAL_SERVER_ERROR");
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        return request;
    }
}
