package com.moonkage.identity.auth.dto;

import com.moonkage.identity.account.atom.PasswordConstant;
import com.moonkage.identity.platform.web.validation.RequestText;
import com.moonkage.identity.profile.ProfileConstant;
import com.moonkage.identity.security.SecurityConstant;
import com.moonkage.identity.shared.PhoneNumber;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/** AC-01.1: email (or phone), full name, password. No personal/business choice. */
@Builder
public record RegisterAccountRequest(
        @NotBlank(message = "{validation.email.required}") @Email(message = "{validation.email.invalid}")
        String email,

        @Pattern(regexp = PhoneNumber.REGEX, message = "{validation.phone.invalid}")
        String phoneNumber,

        @NotBlank(message = "{validation.full_name.required}")
        @Size(max = ProfileConstant.MAX_FULL_NAME_LENGTH, message = "{validation.full_name.too_long}")
        String fullName,

        @NotBlank(message = "{validation.password.required}")
        @Size(
                min = PasswordConstant.MIN_LENGTH,
                max = PasswordConstant.MAX_LENGTH,
                message = "{validation.password.size}")
        String password) {

    /** Cleans itself before validation; the password is kept as typed. A blank phone means none. */
    public RegisterAccountRequest {
        email = RequestText.trim(email);
        phoneNumber = RequestText.trimToNull(phoneNumber);
        fullName = RequestText.trim(fullName);
    }

    @Override
    public String toString() {
        return "RegisterAccountRequest[email=" + email + ", phoneNumber=" + phoneNumber + ", fullName=" + fullName
                + ", password=" + SecurityConstant.REDACTED + "]";
    }
}
