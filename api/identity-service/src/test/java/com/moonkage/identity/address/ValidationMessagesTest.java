package com.moonkage.identity.address;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.auth.dto.RegisterAccountRequest;
import com.moonkage.identity.common.config.LocaleConfig;
import com.moonkage.identity.kyc.dto.request.CheckIdNumberRequest;
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
    void ourKeysAreTranslatedAndFilled() {
        RegisterAccountRequest request = RegisterAccountRequest.builder()
                .email("not-an-email")
                .fullName("A".repeat(101))
                .password("short")
                .build();

        Set<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertEquals(
                Set.of("Email không đúng định dạng", "Họ tên tối đa 100 ký tự", "Mật khẩu từ 8 đến 72 ký tự"),
                messages);
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

    @Test
    void constraintWithoutOurKeyKeepsTheDefaultText() {
        Set<ConstraintViolation<CheckIdNumberRequest>> violations =
                validator.validate(new CheckIdNumberRequest("acc-1", " "));

        // not the raw key "{jakarta.validation.constraints.NotBlank.message}"
        assertEquals(1, violations.size());
        assertFalse(violations.iterator().next().getMessage().startsWith("{"));
    }
}
