package com.moonkage.identity.dto.request;

import com.moonkage.identity.constant.AccountConstant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    private String email;

    @NotBlank(message = "{validation.otp.required}")
    private String otp;

    @NotBlank(message = "{validation.new_password.required}")
    @Size(
            min = AccountConstant.PASSWORD_MIN_LENGTH,
            max = AccountConstant.PASSWORD_MAX_LENGTH,
            message = "{validation.password.size}")
    private String newPassword;
}
