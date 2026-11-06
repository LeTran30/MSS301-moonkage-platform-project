package com.moonkage.identity.profile.dto;

import com.moonkage.identity.common.RequestText;
import com.moonkage.identity.profile.ProfileConstant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** PATCH /api/accounts/me/profile (FR-02): the name the person shows inside the platform. */
public record UpdateProfileRequest(
        @NotBlank(message = "{validation.full_name.required}")
        @Size(max = ProfileConstant.MAX_FULL_NAME_LENGTH, message = "{validation.full_name.too_long}")
        String fullName) {

    public UpdateProfileRequest {
        fullName = RequestText.trim(fullName);
    }
}
