package com.moonkage.catalog.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.api.ApiResponse;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingRequestHeaderException;

/**
 * The error boundary of catalog-service.
 *
 * <p>catalog answers one body everywhere: the {@code ApiResponse} envelope with the codes of
 * {@link CatalogErrorCode}. Until audit finding M-03 (backlog item P1-5) it answered two - the envelope on
 * /api/products and /api/interprovince-fees, and a legacy {@code {status, error, message, path, timestamp}} record
 * everywhere else - and the web had no way to read the legacy one. These tests pin down that there is one shape
 * now, on the public paths and outside them, and that the {@code CAT_*} code strings did not change.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void aBusinessErrorOnTheProductPathsAnswersWithTheEnvelope() {
        CatalogException ex = new CatalogException(CatalogErrorCode.PRODUCT_NOT_FOUND);

        ResponseEntity<Object> response = handler.handleCatalog(ex, request("GET", "/api/products/p-1"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_009");
        assertThat(body.message()).isEqualTo("Sản phẩm không tồn tại hoặc không còn khả dụng");
        assertThat(body.data()).isNull();
    }

    @Test
    void aFailureOnTheProductPathsAnswersWithTheEnvelopeAndTheCatalogCodes() {
        ResponseEntity<Object> response = handler.handleDatabase(
                new org.springframework.dao.DataAccessResourceFailureException("db down"),
                request("GET", "/api/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_008");
        assertThat(body.data()).isNull();
    }

    @Test
    void aFailureOnAnyOtherPathAnswersWithTheEnvelopeToo() {
        ResponseEntity<Object> response = handler.handleDatabase(
                new org.springframework.dao.DataAccessResourceFailureException("db down"),
                request("GET", "/internal/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_008");
        assertThat(body.message()).isEqualTo("Đã xảy ra lỗi, vui lòng thử lại");
        assertThat(body.path()).isEqualTo("/internal/products");
        assertThat(body.data()).isNull();
    }

    @Test
    void aMissingGatewaysHeaderAnswersWithTheEnvelopeOutsideTheProductPathsToo() {
        MissingRequestHeaderException ex = new MissingRequestHeaderException("X-Account-Id", null);

        ResponseEntity<Object> response = handler.handleMissingHeader(ex, request("GET", "/internal/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_002");
        assertThat(body.message()).isEqualTo("Bạn cần đăng nhập");
    }

    @Test
    void aMissingGatewaysHeaderAnswersWithTheEnvelopeOnTheProductPaths() {
        MissingRequestHeaderException ex = new MissingRequestHeaderException("X-Account-Id", null);

        ResponseEntity<Object> response = handler.handleMissingHeader(ex, request("GET", "/api/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_002");
    }

    @Test
    void anUnreadableBodyAnswersWithTheEnvelopeEverywhere() {
        ResponseEntity<Object> response = handler.handleUnreadable(
                new org.springframework.http.converter.HttpMessageNotReadableException("bad json"),
                request("POST", "/internal/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_001");
        assertThat(body.data()).isNull();
    }

    @Test
    void anUnexpectedFailureKeepsItsStatusAndAnswersWithTheEnvelope() {
        ResponseEntity<Object> response =
                handler.handleUnhandled(new IllegalStateException("boom"), request("GET", "/internal/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_008");
        assertThat(body.data()).isNull();
    }

    /**
     * A failure the framework knows the status of keeps that status, as it did on the two public paths of catalog
     * before the move to one shape (a path nothing serves is a 404, not a 500).
     */
    @Test
    void aFailureTheFrameworkKnowsKeepsItsStatus() {
        ResponseEntity<Object> response = handler.handleUnhandled(
                new org.springframework.web.servlet.resource.NoResourceFoundException(
                        org.springframework.http.HttpMethod.GET, "/internal/nothing"),
                request("GET", "/internal/nothing"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("CAT_001");
        assertThat(body.data()).isNull();
    }

    /**
     * The codes a caller reads must not change: the web branches on {@code CAT_001} to {@code CAT_010}, so a
     * different string would break the client even though the shape is the same.
     */
    @Test
    void everyCatalogCodeKeepsItsString() {
        assertThat(CatalogErrorCode.INVALID_REQUEST.getCode()).isEqualTo("CAT_001");
        assertThat(CatalogErrorCode.UNAUTHENTICATED.getCode()).isEqualTo("CAT_002");
        assertThat(CatalogErrorCode.FORBIDDEN.getCode()).isEqualTo("CAT_003");
        assertThat(CatalogErrorCode.INCOMPLETE_FEE_TABLE.getCode()).isEqualTo("CAT_004");
        assertThat(CatalogErrorCode.PROVINCE_NOT_FOUND.getCode()).isEqualTo("CAT_005");
        assertThat(CatalogErrorCode.FEE_NOT_CONFIGURED.getCode()).isEqualTo("CAT_006");
        assertThat(CatalogErrorCode.INTERNAL_ERROR.getCode()).isEqualTo("CAT_008");
        assertThat(CatalogErrorCode.PRODUCT_NOT_FOUND.getCode()).isEqualTo("CAT_009");
        assertThat(CatalogErrorCode.PROJECTION_CONFLICT.getCode()).isEqualTo("CAT_010");
    }

    @Test
    void theStatusOfEveryCatalogCodeIsUnchanged() {
        assertThat(CatalogErrorCode.INVALID_REQUEST.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(CatalogErrorCode.UNAUTHENTICATED.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(CatalogErrorCode.FORBIDDEN.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(CatalogErrorCode.INTERNAL_ERROR.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        return request;
    }
}
