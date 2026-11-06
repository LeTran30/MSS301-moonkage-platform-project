package com.moonkage.catalog.common.exception;

import com.moonkage.catalog.dto.response.ApiResponse;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Central error boundary of catalog-service: the ApiResponse envelope on /api/products and /api/interprovince-fees.
 *
 * <p>BE-09: catalog is a read model, so there is no file upload and no call to another service any more - the
 * handlers for those two cases are gone with the writer they belonged to.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CatalogException.class)
    public ResponseEntity<Object> handleCatalog(CatalogException ex, HttpServletRequest request) {
        CatalogErrorCode code = ex.getErrorCode();
        return ResponseEntity.status(code.getStatus())
                .body(ApiResponse.error(
                        code.getStatus().value(), code.getCode(), code.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Object> handleDatabase(DataAccessException ex, HttpServletRequest request) {
        log.error("Database operation failed", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Object> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không hợp lệ", request);
    }

    /** X-User-* headers are set by the gateway; missing means the call did not come through it with a token. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Object> handleMissingHeader(MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Thiếu thông tin đăng nhập", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnhandled(Exception ex, HttpServletRequest request) {
        if (usesEnvelope(request) && ex instanceof org.springframework.web.ErrorResponse error) {
            return ResponseEntity.status(error.getStatusCode())
                    .body(ApiResponse.error(
                            error.getStatusCode().value(), CatalogErrorCode.INVALID_REQUEST.getCode(),
                            CatalogErrorCode.INVALID_REQUEST.getMessage(), request.getRequestURI()));
        }
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.", request);
    }

    private ResponseEntity<Object> build(HttpStatus status, String message, HttpServletRequest request) {
        if (usesEnvelope(request)) {
            CatalogErrorCode code = switch (status) {
                case BAD_REQUEST -> CatalogErrorCode.INVALID_REQUEST;
                case UNAUTHORIZED -> CatalogErrorCode.UNAUTHENTICATED;
                case FORBIDDEN -> CatalogErrorCode.FORBIDDEN;
                default -> CatalogErrorCode.INTERNAL_ERROR;
            };
            return ResponseEntity.status(status)
                    .body(ApiResponse.error(
                            status.value(), code.getCode(), code.getMessage(), request.getRequestURI()));
        }
        return ResponseEntity.status(status)
                .body(new ErrorResponse(
                        status.value(), status.getReasonPhrase(), message, request.getRequestURI(), Instant.now()));
    }

    private boolean usesEnvelope(HttpServletRequest request) {
        String path = request.getServletPath().isEmpty() ? request.getRequestURI() : request.getServletPath();
        return path.equals("/api/interprovince-fees")
                || path.startsWith("/api/interprovince-fees/")
                || path.equals("/api/products")
                || path.startsWith("/api/products/");
    }
}
