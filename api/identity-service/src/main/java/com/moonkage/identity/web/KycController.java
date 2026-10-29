package com.moonkage.identity.web;

import com.moonkage.identity.kyc.LegalProfileService;
import com.moonkage.identity.kyc.NfcService;
import com.moonkage.identity.kyc.dto.request.SubmitCardRequest;
import com.moonkage.identity.kyc.dto.response.CreateNfcSessionResponse;
import com.moonkage.identity.kyc.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.kyc.dto.response.NfcStatusResponse;
import com.moonkage.identity.kyc.dto.response.SubmitCardResponse;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every NFC resource of FR-04 (Software Design 5.1, 7.7). Under {@code /api/nfc}: the web creates the session and
 * shows it as a QR; the Moonkage Verify app, logged in to the same account, sends the card once; every endpoint needs
 * the JWT. Under {@code /internal/nfc}: other services read the NFC status of any account (OpenFeign only; the
 * gateway blocks /internal/** from outside).
 */
@RestController
@RequiredArgsConstructor
public class KycController {

    private final NfcService nfcService;
    private final LegalProfileService legalProfileService;

    /** Web, AC-04.1. */
    @PostMapping("/api/nfc/sessions")
    public ResponseEntity<ApiResponse<CreateNfcSessionResponse>> createSession(
            @CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(nfcService.createSession(currentUser.accountId())));
    }

    /** Web (fallback when the WebSocket push is missed) and app (before the tap). 410 expired, 403 not owned. */
    @GetMapping("/api/nfc/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<NfcSessionStatusResponse>> getSession(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(nfcService.getSession(sessionId, currentUser.accountId())));
    }

    /**
     * App, after the user taps Save. 200 also when rejected: see {@code data.status} and {@code data.reasonCode}.
     * No {@code @Valid} on purpose: a malformed card is a counted attempt answered BAD_FORMAT, not a 400 (AC-04.9).
     */
    @PostMapping("/api/nfc/sessions/{sessionId}/card")
    public ResponseEntity<ApiResponse<SubmitCardResponse>> submitCard(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String sessionId,
            @RequestBody SubmitCardRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(nfcService.submitCard(sessionId, currentUser.accountId(), request)));
    }

    /** NFC status of the caller's own account, masked data only. */
    @GetMapping("/api/nfc/status")
    public ResponseEntity<ApiResponse<NfcStatusResponse>> getMyNfcStatus(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(legalProfileService.getNfcStatus(currentUser.accountId())));
    }

    /** BR-23 for vendor-service and quotation-service; AC-45.1. Masked data only, 404 when the account is unknown. */
    @Hidden
    @GetMapping("/internal/nfc/status/{accountId}")
    public ResponseEntity<NfcStatusResponse> getNfcStatus(@PathVariable String accountId) {
        return ResponseEntity.ok(legalProfileService.getNfcStatus(accountId));
    }
}
