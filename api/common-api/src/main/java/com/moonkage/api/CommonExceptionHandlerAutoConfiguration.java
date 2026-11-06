package com.moonkage.api;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;

/**
 * Registers the shared error boundary in every service that depends on common-api.
 *
 * <p>A {@code @RestControllerAdvice} in a library jar is not picked up by the component scan of a service, because the
 * scan only looks at the service's own packages. Listing this configuration in
 * {@code META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports} is what makes the advice
 * part of the context, so a service does not have to remember to import it.
 *
 * <p>The advice is only registered when the service has not brought one of its own: a service that keeps its own advice
 * for its {@code AppException} extends {@link CommonExceptionHandler} and gets one advice with both sets of handlers,
 * and a service that has no advice of its own gets this one. A service whose error boundary is its own by design (a
 * different envelope, its own code strings) turns the registration off with
 * {@code moonkage.common-api.error-handler.enabled=false}.
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(
        prefix = "moonkage.common-api.error-handler",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class CommonExceptionHandlerAutoConfiguration {

    /**
     * The shared advice, with the texts of the service's own message bundle.
     *
     * <p>The {@code MessageSource} is optional: a service without a bundle of its own still gets the advice, with the
     * default wording of {@link CommonExceptionHandler}.
     */
    @Bean
    @ConditionalOnMissingBean
    public CommonExceptionHandler commonExceptionHandler(ObjectProvider<MessageSource> messageSource) {
        return new CommonExceptionHandler(messageSource.getIfAvailable());
    }
}
