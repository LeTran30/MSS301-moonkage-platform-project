package com.moonkage.quotation.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.CommonErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingRequestHeaderException;

/**
 * The error boundary of quotation-service.
 *
 * <p>The shared boundary of common-api answers the framework failures; this advice answers quotation's own business
 * errors and the refusal of a request that came without the gateway's headers. The wording of the shared failures is
 * quotation's own, so the tests here pin down that a caller reads exactly the same words as before the shared
 * boundary was introduced.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void aBusinessErrorAnswersWithItsOwnCodeAndText() {
        AppException ex = new AppException(ErrorCode.REQUEST_NOT_OPEN);

        ApiResponse<Void> body = handler.handleAppException(ex, request("GET", "/api/quote-requests"))
                .getBody();

        assertThat(body).isNotNull();
        assertThat(body.status()).isEqualTo(409);
        assertThat(body.code()).isEqualTo("QUOTE_021");
        assertThat(body.message()).isEqualTo("Yêu cầu không còn mở.");
        assertThat(body.data()).isNull();
        assertThat(body.path()).isEqualTo("/api/quote-requests");
        // a business error names no field: the whole request is wrong
        assertThat(body.errors()).isNull();
    }

    @Test
    void aBusinessErrorWithAPlaceholderKeepsItsPattern() {
        AppException ex = new AppException(ErrorCode.INVALID_PROVINCE, "99");

        ApiResponse<Void> body = handler.handleAppException(ex, request("GET", "/api/quote-requests"))
                .getBody();

        assertThat(body).isNotNull();
        assertThat(body.message()).isEqualTo("Mã tỉnh 99 không hợp lệ.");
    }

    @Test
    void aRequestWithoutTheGatewaysHeaderIsRefused() {
        // the parameter is only read for the message; the header name is what the answer is built from
        MissingRequestHeaderException ex = new MissingRequestHeaderException("X-Account-Id", null);

        ResponseEntity<ApiResponse<Void>> response =
                handler.handleMissingHeader(ex, request("GET", "/api/quote-requests"));

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("COMMON_401");
        assertThat(body.message()).isEqualTo("Thiếu thông tin đăng nhập.");
        assertThat(body.data()).isNull();
    }

    @Test
    void theCommonCodesTakeTheirStringAndStatusFromTheSharedList() {
        assertThat(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .isEqualTo(CommonErrorCode.INTERNAL_SERVER_ERROR.getCode());
        assertThat(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .isEqualTo(CommonErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus());
        assertThat(ErrorCode.INVALID_INPUT.getCode()).isEqualTo("COMMON_400");
        assertThat(ErrorCode.MALFORMED_JSON.getCode()).isEqualTo("COMMON_400_JSON");
        assertThat(ErrorCode.UNAUTHENTICATED.getCode()).isEqualTo("COMMON_401");
        assertThat(ErrorCode.ACCESS_DENIED.getCode()).isEqualTo("COMMON_403");
        assertThat(ErrorCode.RESOURCE_NOT_FOUND.getCode()).isEqualTo("COMMON_404");
        assertThat(ErrorCode.METHOD_NOT_ALLOWED.getCode()).isEqualTo("COMMON_405");
        assertThat(ErrorCode.INVALID_STATE_TRANSITION.getCode()).isEqualTo("COMMON_409");
        assertThat(ErrorCode.DEPENDENCY_UNAVAILABLE.getCode()).isEqualTo("COMMON_503");
    }

    @Test
    void theCommonCodesKeepTheTextQuotationAlwaysShowed() {
        // the wording the service answered with before the shared boundary existed
        assertThat(ErrorCode.INTERNAL_SERVER_ERROR.getMessage()).isEqualTo("Đã xảy ra lỗi không mong muốn.");
        assertThat(ErrorCode.INVALID_INPUT.getMessage()).isEqualTo("Dữ liệu gửi lên không hợp lệ.");
        assertThat(ErrorCode.MALFORMED_JSON.getMessage()).isEqualTo("Nội dung gửi lên không đọc được.");
        assertThat(ErrorCode.UNAUTHENTICATED.getMessage()).isEqualTo("Thiếu thông tin đăng nhập.");
        assertThat(ErrorCode.ACCESS_DENIED.getMessage()).isEqualTo("Bạn không có quyền thực hiện thao tác này.");
        assertThat(ErrorCode.RESOURCE_NOT_FOUND.getMessage()).isEqualTo("Không tìm thấy đường dẫn.");
        assertThat(ErrorCode.METHOD_NOT_ALLOWED.getMessage()).isEqualTo("Phương thức không được hỗ trợ.");
        assertThat(ErrorCode.INVALID_STATE_TRANSITION.getMessage()).isEqualTo("Không thể chuyển sang trạng thái {0}.");
        assertThat(ErrorCode.DEPENDENCY_UNAVAILABLE.getMessage())
                .isEqualTo("Dịch vụ liên quan đang không phản hồi. Vui lòng thử lại.");
    }

    @Test
    void theSharedBoundaryAnswersWithQuotationsOwnWording() {
        // the shared boundary reads the wording from this advice, not from a message bundle
        assertThat(handler.localize(CommonErrorCode.INTERNAL_SERVER_ERROR, null))
                .isEqualTo("Đã xảy ra lỗi không mong muốn.");
        assertThat(handler.localize(CommonErrorCode.MALFORMED_JSON, null))
                .isEqualTo("Nội dung gửi lên không đọc được.");
        assertThat(handler.localize(CommonErrorCode.RESOURCE_NOT_FOUND, null)).isEqualTo("Không tìm thấy đường dẫn.");
        assertThat(handler.localize(CommonErrorCode.METHOD_NOT_ALLOWED, null))
                .isEqualTo("Phương thức không được hỗ trợ.");
    }

    @Test
    void theTextWithAPlaceholderIsStillFormatted() {
        assertThat(handler.localize(CommonErrorCode.INVALID_STATE_TRANSITION, new Object[] {"CANCELLED"}))
                .isEqualTo("Không thể chuyển sang trạng thái CANCELLED.");
    }

    @Test
    void theStatusOfACommonCodeIsTheSharedOne() {
        assertThat(ErrorCode.INVALID_INPUT.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ErrorCode.RESOURCE_NOT_FOUND.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ErrorCode.METHOD_NOT_ALLOWED.getHttpStatus()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(ErrorCode.INVALID_STATE_TRANSITION.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ErrorCode.DEPENDENCY_UNAVAILABLE.getHttpStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ErrorCode.ACCESS_DENIED.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ErrorCode.UNAUTHENTICATED.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        return request;
    }
}
