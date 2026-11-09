package com.moonkage.catalog.common.exception;

import com.moonkage.api.ApiResponse;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import jakarta.servlet.http.HttpServletRequest;
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
 * Central error boundary of catalog-service: every failure answers with the one {@link ApiResponse} envelope.
 *
 * <p>BE-09: catalog is a read model, so there is no file upload and no call to another service any more - the
 * handlers for those two cases are gone with the writer they belonged to.
 *
 * <p>This advice stays on its own and does not extend {@code CommonExceptionHandler}, the shared boundary of the
 * other services, for one reason that shows in what a caller reads: catalog's error vocabulary is its own. The
 * shared boundary answers the {@code COMMON_*} code strings, while a caller of catalog reads {@code CAT_001} to
 * {@code CAT_010}, and those strings must not change.
 *
 * <p>Because the advice is not a {@code CommonExceptionHandler}, the auto-configuration of common-api would register
 * the shared boundary here as well, and the two catch-all handlers would compete for every failure that is not a
 * business error. The service therefore turns that registration off with
 * {@code moonkage.common-api.error-handler.enabled=false} in its application.yml.
 *
 * <p>Until audit finding M-03 (backlog item P1-5) this advice answered <em>two</em> bodies: the envelope on
 * /api/products and /api/interprovince-fees, and a legacy {@code {status, error, message, path, timestamp}} record
 * everywhere else. The web reads the envelope ({@code code}, {@code data}) and has no way to read the legacy body,
 * so a failure outside those four paths reached the user as an empty list instead of a message. Every path answers
 * the envelope now, with the same status codes and the same {@code CAT_*} code strings as before.
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
        return build(HttpStatus.INTERNAL_SERVER_ERROR, CatalogErrorCode.INTERNAL_ERROR, request);
    }

    /**
     * A body that does not hold a valid value.
     *
     * <p>The message is the one of {@link CatalogErrorCode#INVALID_REQUEST} and not the list of the wrong fields:
     * that is what the two public paths of catalog answered before, so the body a caller reads does not change
     * apart from the shape.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, CatalogErrorCode.INVALID_REQUEST, request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Object> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, CatalogErrorCode.INVALID_REQUEST, request);
    }

    /** X-User-* headers are set by the gateway; missing means the call did not come through it with a token. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Object> handleMissingHeader(MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, CatalogErrorCode.UNAUTHENTICATED, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnhandled(Exception ex, HttpServletRequest request) {
        if (ex instanceof org.springframework.web.ErrorResponse error) {
            // the framework knows the status (404 for a path nothing serves, 405 for a wrong method, ...):
            // it is kept, and the code is the one of a bad request
            return ResponseEntity.status(error.getStatusCode())
                    .body(ApiResponse.error(
                            error.getStatusCode().value(),
                            CatalogErrorCode.INVALID_REQUEST.getCode(),
                            CatalogErrorCode.INVALID_REQUEST.getMessage(),
                            request.getRequestURI()));
        }
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, CatalogErrorCode.INTERNAL_ERROR, request);
    }

    /**
     * The envelope for a failure that is not a business error.
     *
     * @param status the HTTP status, unchanged by the move to one shape
     * @param code the catalog code that goes with the status
     * @param request the request, for the {@code path} of the answer
     */
    private ResponseEntity<Object> build(HttpStatus status, CatalogErrorCode code, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(ApiResponse.error(status.value(), code.getCode(), code.getMessage(), request.getRequestURI()));
    }
}
