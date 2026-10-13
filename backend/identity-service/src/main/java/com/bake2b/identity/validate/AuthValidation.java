package com.bake2b.identity.validate;

import com.bake2b.identity.common.exception.EmailAlreadyExistsException;
import com.bake2b.identity.dto.request.AccountCreateRequest;
import com.bake2b.identity.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthValidation {

    private final AccountRepository accountRepository;

    /** AC-01.3: an email or phone already bound to an account cannot register again. */
    public void validate(AccountCreateRequest request) {
        String result = accountRepository.validateAccountUniqueness(request.getEmail(), request.getPhoneNumber());
        switch (result) {
            case "EMAIL_EXISTS" -> throw new EmailAlreadyExistsException("Email đã được sử dụng");
            case "PHONE_EXISTS" -> throw new EmailAlreadyExistsException("Số điện thoại đã được sử dụng");
            default -> {
            }
        }
    }
}
