package com.moonkage.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;

class StorageMessagesTest {

    private static final Locale VI = Locale.forLanguageTag("vi");

    private final ResourceBundleMessageSource messageSource = messageSource();

    @Test
    void everyErrorCodeHasText() {
        for (StorageErrorCode code : StorageErrorCode.values()) {
            assertThat(messageSource.getMessage(code.getMessageKey(), null, null, VI))
                    .as(code.name())
                    .isNotBlank();
        }
    }

    @Test
    void textIsReadAsUtf8AndFillsArgs() {
        assertThat(messageSource.getMessage(StorageErrorCode.FILE_TOO_LARGE.getMessageKey(), new Object[] {5L}, VI))
                .isEqualTo("File vượt quá 5 MB.");
    }

    /** Same settings Spring Boot uses for spring.messages.basename. */
    private static ResourceBundleMessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("storage-messages");
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        return source;
    }
}
