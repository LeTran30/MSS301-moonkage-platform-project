package com.moonkage.vendor.client;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;

/**
 * Feign configuration of {@link IdentityClient} only (not a @Configuration, so it does not apply to other clients).
 * The 4xx answers identity documents become AppException; anything else stays a FeignException, which
 * GlobalExceptionHandler answers with 503.
 */
public class IdentityClientConfig {

    @Bean
    ErrorDecoder identityErrorDecoder() {
        ErrorDecoder fallback = new ErrorDecoder.Default();
        return (methodKey, response) -> {
            if (response.status() == HttpStatus.NOT_FOUND.value()) {
                return new AppException(ErrorCode.ACCOUNT_NOT_FOUND);
            }
            if (response.status() == HttpStatus.BAD_REQUEST.value()) {
                return new AppException(ErrorCode.INVALID_INPUT);
            }
            return fallback.decode(methodKey, response);
        };
    }
}
