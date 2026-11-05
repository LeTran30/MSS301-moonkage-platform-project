package com.moonkage.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.MessageSource;
import org.springframework.context.support.StaticMessageSource;

/**
 * The shared error boundary has to be part of every service that depends on common-api.
 *
 * <p>A {@code @RestControllerAdvice} in a library jar is not found by the component scan of a service, because the
 * scan only looks at the service's own packages. The auto-configuration is what puts the advice into the context,
 * so this test checks that the registration works and that it stays out of the way of a service that brings an
 * advice of its own.
 *
 * <p>The runner is a web one, because the advice is only registered in a servlet application: it answers HTTP
 * requests.
 */
class CommonExceptionHandlerAutoConfigurationTest {

    private final WebApplicationContextRunner runner = new WebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(CommonExceptionHandlerAutoConfiguration.class));

    @Test
    void theSharedAdviceIsRegisteredForAServiceWithoutOneOfItsOwn() {
        runner.run(context -> {
            assertThat(context).hasSingleBean(CommonExceptionHandler.class);
            assertThat(context.getBean(CommonExceptionHandler.class)).isNotNull();
        });
    }

    @Test
    void theSharedAdviceIsNotRegisteredWhenTheServiceBringsOneOfItsOwn() {
        CommonExceptionHandler ownAdvice = new CommonExceptionHandler(null);

        runner.withBean(CommonExceptionHandler.class, () -> ownAdvice).run(context -> {
            assertThat(context).hasSingleBean(CommonExceptionHandler.class);
            // the service's own advice wins: the shared one must not be registered beside it
            assertThat(context.getBean(CommonExceptionHandler.class)).isSameAs(ownAdvice);
        });
    }

    @Test
    void theSharedAdviceCanBeTurnedOff() {
        // catalog-service does this: its error boundary answers two different bodies (audit M-03)
        runner.withPropertyValues("moonkage.common-api.error-handler.enabled=false")
                .run(context -> assertThat(context).doesNotHaveBean(CommonExceptionHandler.class));
    }

    @Test
    void theAdviceIsBuiltWithTheMessageBundleOfTheService() {
        runner.withBean(MessageSource.class, () -> {
                    StaticMessageSource source = new StaticMessageSource();
                    source.addMessage("error.common.internal", Locale.getDefault(), "Lỗi hệ thống");
                    return source;
                })
                .run(context -> assertThat(context).hasSingleBean(CommonExceptionHandler.class));
    }

    @Test
    void theAdviceIsBuiltWithoutAMessageBundleToo() {
        // a service that keeps no bundle of its own still gets the advice, with the shared default wording
        runner.run(context -> assertThat(context).hasSingleBean(CommonExceptionHandler.class));
    }
}
