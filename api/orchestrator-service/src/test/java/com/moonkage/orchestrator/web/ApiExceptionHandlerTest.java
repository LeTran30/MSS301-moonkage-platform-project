package com.moonkage.orchestrator.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.api.ApiResponse;
import com.moonkage.orchestrator.application.NotificationNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;

/**
 * The error boundary of orchestrator-service.
 *
 * <p>orchestrator names its failures with its own code strings, not the shared {@code COMMON_*} ones, because the web
 * and the scripts around it already read them. These tests pin down that the shared boundary answers with
 * orchestrator's strings, and that the framework failures orchestrator takes over are answered the way every other
 * service answers them.
 */
class ApiExceptionHandlerTest {

    private ApiExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new ApiExceptionHandler();
    }

    @Test
    void aNotificationThatDoesNotExistAnswersWithOrchestratorsOwnCode() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleNotFound(new NotificationNotFoundException("n-1"), request("GET", "/api/notifications"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("NOTIFICATION_NOT_FOUND");
        assertThat(body.message()).isEqualTo("Không tìm thấy thông báo");
        assertThat(body.data()).isNull();
        assertThat(body.path()).isEqualTo("/api/notifications");
    }

    @Test
    void aRequestWithoutTheGatewaysHeaderAnswersWithOrchestratorsOwnCode() {
        MissingRequestHeaderException ex = new MissingRequestHeaderException("X-Account-Id", null);

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleMissingHeader(ex, request("GET", "/api/notifications"));

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("UNAUTHENTICATED");
        assertThat(body.message()).isEqualTo("Thiếu thông tin đăng nhập");
        assertThat(body.data()).isNull();
    }

    @Test
    void anArgumentThatIsNotValidAnswersWithOrchestratorsOwnCode() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleInvalid(
                new IllegalArgumentException("Số lượng phải lớn hơn 0"), request("POST", "/api/x"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("INVALID_REQUEST");
        assertThat(body.message()).isEqualTo("Số lượng phải lớn hơn 0");
        assertThat(body.data()).isNull();
    }

    @Test
    void aFailureNobodyExpectedAnswersWithOrchestratorsOwnCode() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleUncaughtException(new RuntimeException("boom"), request("GET", "/api/notifications"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("INTERNAL_ERROR");
        assertThat(body.message()).isEqualTo("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
        assertThat(body.data()).isNull();
    }

    @Test
    void aFieldThatIsNotValidIsABadRequestNamingTheField() {
        // the shared boundary answers this one, like in every other service
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "quantity", "Số lượng phải lớn hơn 0"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleValidationException(ex, request("POST", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("INVALID_REQUEST");
        assertThat(body.data()).isNull();
        assertThat(body.errors()).extracting(ApiResponse.FieldError::field).containsExactly("quantity");
    }

    @Test
    void aPathNothingServesIsNotFound() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleNoResource(
                new org.springframework.web.servlet.resource.NoResourceFoundException(
                        org.springframework.http.HttpMethod.GET, "/api/unknown"),
                request("GET", "/api/unknown"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("NOTIFICATION_NOT_FOUND");
    }

    @Test
    void aMethodThePathDoesNotServeIsNotAllowed() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleMethodNotSupported(
                new org.springframework.web.HttpRequestMethodNotSupportedException("DELETE"),
                request("DELETE", "/api/notifications"));

        assertThat(response.getStatusCode().value()).isEqualTo(405);
        assertThat(response.getBody()).isNotNull();
        // orchestrator has no code of its own for this one: it keeps the shared one
        assertThat(response.getBody().code()).isEqualTo("COMMON_405");
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        return request;
    }
}
