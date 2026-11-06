package com.moonkage.order.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingServletRequestParameterException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(messages());

    @Test
    void aMissingQueryParameterIsABadRequestNamingTheParameter() {
        var response = handler.handleMissingParameter(
                new MissingServletRequestParameterException("provinceCode", "String"),
                new MockHttpServletRequest("GET", "/api/carts/me"));

        assertEquals(400, response.getStatusCode().value());
        assertEquals(ErrorCode.PARAMETER_REQUIRED.getCode(), response.getBody().code());
        assertEquals("provinceCode", response.getBody().errors().getFirst().field());
    }

    private static ResourceBundleMessageSource messages() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        return source;
    }
}
