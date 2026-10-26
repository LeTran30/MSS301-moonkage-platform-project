package com.moonkage.payment.config;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

@Configuration
public class LocaleConfig {

    private static final Locale LOCALE_VI = Locale.forLanguageTag("vi");

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(LOCALE_VI, Locale.ENGLISH));
        resolver.setDefaultLocale(LOCALE_VI);
        return resolver;
    }

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = messagesBundle();
        messageSource.setUseCodeAsDefaultMessage(true);
        return messageSource;
    }

    /**
     * Bean validation reads {@code message = "{validation.*}"} from the same messages.properties, in the request
     * locale. Its own bundle does not fall back to the key, so a constraint without a message of ours still gets
     * Hibernate Validator's default text.
     */
    @Bean
    public LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.setValidationMessageSource(messagesBundle());
        return validator;
    }

    private static ResourceBundleMessageSource messagesBundle() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasenames("messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        return messageSource;
    }
}
