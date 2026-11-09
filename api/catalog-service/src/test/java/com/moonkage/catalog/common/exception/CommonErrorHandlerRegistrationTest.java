package com.moonkage.catalog.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.api.CommonExceptionHandler;
import com.moonkage.api.CommonExceptionHandlerAutoConfiguration;
import java.io.IOException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

/**
 * catalog keeps its own error boundary, so the shared one must not be registered beside it.
 *
 * <p>The shared boundary of common-api is registered by an auto-configuration for every service that depends on
 * common-api, unless the service turns it off. catalog answers the envelope with its own {@code CAT_*} codes, while
 * the shared boundary would answer the {@code COMMON_*} codes on every path - and a caller of catalog reads the
 * {@code CAT_*} strings today, so they must not change. This test checks that the setting is there and that it has
 * the effect the service needs.
 */
class CommonErrorHandlerRegistrationTest {

    @Test
    void theServiceTurnsTheSharedBoundaryOff() throws IOException {
        assertThat(property("moonkage.common-api.error-handler.enabled")).isEqualTo("false");
    }

    @Test
    void withTheSettingNoSharedBoundaryIsRegistered() {
        new WebApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(CommonExceptionHandlerAutoConfiguration.class))
                .withPropertyValues("moonkage.common-api.error-handler.enabled=false")
                .run(context -> assertThat(context).doesNotHaveBean(CommonExceptionHandler.class));
    }

    @Test
    void withoutTheSettingTheSharedBoundaryWouldBeRegistered() {
        // without the setting in application.yml, catalog would answer with the shared envelope and the COMMON_*
        // codes on every path, which is not what a caller of catalog reads today
        new WebApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(CommonExceptionHandlerAutoConfiguration.class))
                .run(context -> assertThat(context).hasSingleBean(CommonExceptionHandler.class));
    }

    private static String property(String name) throws IOException {
        List<PropertySource<?>> sources =
                new YamlPropertySourceLoader().load("catalog", new ClassPathResource("application.yml"));
        return sources.stream()
                .map(source -> source.getProperty(name))
                .filter(java.util.Objects::nonNull)
                .map(Object::toString)
                .findFirst()
                .orElse(null);
    }
}
