package com.moonkage.identity.address;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.platform.config.LocaleConfig;
import jakarta.validation.ConstraintViolation;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

/** Q-08: DTO messages come from messages.properties, with {min} / {max} filled from the annotation. */
class ValidationMessagesTest {

    private static LocalValidatorFactoryBean validator;

    @BeforeAll
    static void setUp() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("vi"));
        validator = new LocaleConfig().validator();
        validator.afterPropertiesSet();
    }

    @AfterAll
    static void tearDown() {
        validator.close();
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void addressNeedsNationalCodeOfProvince() {
        AddAddressRequest request = AddAddressRequest.builder()
                .recipientName("Nguyễn Lan")
                .recipientPhone("0212345678")
                .provinceCode("HCM")
                .provinceName("Thành phố Hồ Chí Minh")
                .wardName("Phường Sài Gòn")
                .detail("12 Lê Lợi")
                .build();

        Set<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertEquals(Set.of("Số điện thoại người nhận không hợp lệ", "Mã tỉnh/thành phố không hợp lệ"), messages);
    }

    @Test
    void unknownProvinceCodeIsRejected() {
        AddAddressRequest request = AddAddressRequest.builder()
                .recipientName("Nguyễn Lan")
                .recipientPhone("0912345678")
                .provinceCode("74")
                .provinceName("Thành phố Hồ Chí Minh")
                .wardName("Phường Sài Gòn")
                .detail("12 Lê Lợi")
                .build();

        Set<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertEquals(Set.of("Mã tỉnh/thành phố không hợp lệ"), messages);
    }
}
