package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.IdNumberCheckRequest;
import com.moonkage.identity.dto.response.IdNumberCheckResponse;
import com.moonkage.identity.service.LegalProfileService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * vendor-service hashes a declared ID number here instead of holding the pepper itself (D-07, BR-27). The body holds
 * a full ID number: do not log it. The gateway blocks internal paths from outside.
 */
@Hidden
@RestController
@RequestMapping("/internal/id-numbers")
@RequiredArgsConstructor
public class InternalIdNumberController {

    private final LegalProfileService legalProfileService;

    /** 400 ID_NUMBER_INVALID unless 12 digits, 404 when the account is unknown. */
    @PostMapping("/check")
    public ResponseEntity<IdNumberCheckResponse> check(@RequestBody @Valid IdNumberCheckRequest request) {
        return ResponseEntity.ok(legalProfileService.checkIdNumber(request));
    }
}
