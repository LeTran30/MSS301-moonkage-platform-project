package com.moonkage.vendor.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import com.moonkage.vendor.client.dto.CheckIdNumberRequest;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import feign.FeignException;
import feign.Request;
import feign.Response;
import feign.codec.ErrorDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;

class IdentityClientConfigTest {

    private static final String METHOD_KEY = "IdentityClient#getNfcStatus(String)";

    private final ErrorDecoder decoder = new IdentityClientConfig().identityErrorDecoder();

    @Test
    void anUnknownAccountBecomesAccountNotFound() {
        Exception decoded = decoder.decode(METHOD_KEY, response(404));

        assertEquals(
                ErrorCode.ACCOUNT_NOT_FOUND,
                assertInstanceOf(AppException.class, decoded).getErrorCode());
    }

    @Test
    void aRejectedIdNumberBecomesInvalidInput() {
        Exception decoded = decoder.decode(METHOD_KEY, response(400));

        assertEquals(
                ErrorCode.INVALID_INPUT,
                assertInstanceOf(AppException.class, decoded).getErrorCode());
    }

    @Test
    void aServerErrorStaysAFeignException() {
        Exception decoded = decoder.decode(METHOD_KEY, response(500));

        assertInstanceOf(FeignException.class, decoded);
    }

    @Test
    void theIdNumberNeverAppearsInALoggedRequest() {
        String logged = new CheckIdNumberRequest("079123456789").toString();

        assertFalse(logged.contains("079123456789"), logged);
    }

    private static Response response(int status) {
        Request request = Request.create(
                Request.HttpMethod.GET,
                "/internal/accounts/a/profile/kyc",
                Map.of(),
                null,
                StandardCharsets.UTF_8,
                null);
        return Response.builder()
                .status(status)
                .request(request)
                .headers(Map.of())
                .build();
    }
}
