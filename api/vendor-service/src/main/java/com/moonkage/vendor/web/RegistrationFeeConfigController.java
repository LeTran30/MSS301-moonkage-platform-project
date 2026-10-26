package com.moonkage.vendor.web;

import com.moonkage.vendor.common.exception.ApiResponse;
import com.moonkage.vendor.registrationfee.RegistrationFeeService;
import com.moonkage.vendor.registrationfee.dto.ChangeRegistrationFeeRequest;
import com.moonkage.vendor.registrationfee.dto.RegistrationFeeConfigResponse;
import com.moonkage.vendor.security.CurrentUser;
import com.moonkage.vendor.security.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Root RegistrationFeeConfig (docs/architecture/api-db/vendor.md): the one registration fee level in effect. */
@RestController
@RequestMapping("/api/registration-fee-config")
@RequiredArgsConstructor
public class RegistrationFeeConfigController {

    private final RegistrationFeeService registrationFeeService;

    /** Open to guests: the profile form shows the fee before anyone registers (AC-26.9). */
    @GetMapping
    public ResponseEntity<ApiResponse<RegistrationFeeConfigResponse>> getCurrentConfig() {
        return ResponseEntity.ok(ApiResponse.ok(registrationFeeService.getCurrentConfig()));
    }

    /** Admin only: a new level from now on (FR-53). */
    @PutMapping
    public ResponseEntity<ApiResponse<RegistrationFeeConfigResponse>> changeFee(
            @CurrentUser CurrentUserInfo caller, @RequestBody ChangeRegistrationFeeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(registrationFeeService.changeFee(caller, request)));
    }
}
