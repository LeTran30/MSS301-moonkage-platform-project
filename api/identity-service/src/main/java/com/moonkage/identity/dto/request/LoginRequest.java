package com.moonkage.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Email or phone number (FR-02). */
    @NotBlank(message = "Vui lòng nhập username")
    private String username;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    private String password;
}
