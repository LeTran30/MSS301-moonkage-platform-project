package com.moonkage.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.shared.error.CommonError;
import com.moonkage.identity.shared.error.ErrorCode;
import com.moonkage.identity.shared.error.LegacyError;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/** Every error code is unique and has its message in every language file (plan v2 8.2). */
class ErrorCodeCatalogTest {

    /** Each module's {@code <Module>Error} enum joins this list when it is created. */
    private static final List<ErrorCode> ALL = Stream.of(
                    CommonError.values(),
                    LegacyError.values(),
                    AccountError.values(),
                    OtpError.values(),
                    AuthError.values(),
                    BearerTokenError.values())
            .flatMap(Stream::of)
            .map(ErrorCode.class::cast)
            .toList();

    @Test
    void codesAreUnique() {
        List<String> repeated =
                ALL.stream().collect(Collectors.groupingBy(ErrorCode::code, Collectors.counting())).entrySet().stream()
                        .filter(e -> e.getValue() > 1)
                        .map(Map.Entry::getKey)
                        .toList();
        assertEquals(List.of(), repeated);
    }

    @Test
    void everyMessageKeyIsInEveryMessagesFile() throws IOException {
        Resource[] files = new PathMatchingResourcePatternResolver().getResources("classpath*:messages*.properties");
        assertTrue(files.length > 0, "no messages*.properties on the classpath");
        for (Resource file : files) {
            Properties messages = load(file);
            List<String> missing = ALL.stream()
                    .map(ErrorCode::messageKey)
                    .filter(key -> !messages.containsKey(key))
                    .toList();
            assertEquals(List.of(), missing, file.getFilename());
        }
    }

    private static Properties load(Resource file) throws IOException {
        Properties properties = new Properties();
        try (InputStream in = file.getInputStream()) {
            properties.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        }
        return properties;
    }
}
