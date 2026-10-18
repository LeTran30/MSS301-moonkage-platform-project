package com.moonkage.identity.controller;

import com.moonkage.identity.dto.response.NfcStatusResponse;
import com.moonkage.identity.service.LegalProfileService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Called by other services through OpenFeign only; the gateway blocks internal paths from outside. */
@Hidden
@RestController
@RequestMapping("/internal/accounts")
@RequiredArgsConstructor
public class InternalAccountController {

    private final LegalProfileService legalProfileService;

    /** BR-23 for vendor-service and quotation-service; AC-45.1. 404 when the account is unknown. */
    @GetMapping("/{accountId}/nfc-status")
    public ResponseEntity<NfcStatusResponse> getNfcStatus(@PathVariable String accountId) {
        return ResponseEntity.ok(legalProfileService.getNfcStatus(accountId));
    }
}
