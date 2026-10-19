package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.ApiResponse;
import com.moonkage.identity.dto.response.CreateNfcSessionResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.NfcStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.nfc.LegalProfileService;
import com.moonkage.identity.nfc.NfcService;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every public NFC resource of FR-04, under {@code /api/nfc} (Software Design 5.1, 7.7). The web creates the
 * session and shows it as a QR; the Moonkage Verify app, logged in to the same account, sends the card once. Every
 * endpoint needs the JWT. Other services read the NFC status of any account through
 * {@code GET /internal/nfc/status/{accountId}}.
 */
@RestController
@RequestMapping("/api/nfc")
@RequiredArgsConstructor
public class NfcController {

    private final NfcService nfcService;
    private final LegalProfileService legalProfileService;

    /** Web, AC-04.1. */
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<CreateNfcSessionResponse>> createSession(
            @CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(nfcService.createSession(currentUser.accountId())));
    }

    /** Web (fallback when the WebSocket push is missed) and app (before the tap). 410 expired, 403 not owned. */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<NfcSessionStatusResponse>> getSession(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(nfcService.getSession(sessionId, currentUser.accountId())));
    }

    /**
     * App, after the user taps Save. 200 also when rejected: see {@code data.status} and {@code data.reasonCode}.
     * No {@code @Valid} on purpose: a malformed card is a counted attempt answered BAD_FORMAT, not a 400 (AC-04.9).
     */
    @PostMapping("/sessions/{sessionId}/card")
    public ResponseEntity<ApiResponse<SubmitCardResponse>> submitCard(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String sessionId,
            @RequestBody SubmitCardRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(nfcService.submitCard(sessionId, currentUser.accountId(), request)));
    }

    /** NFC status of the caller's own account, masked data only. */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<NfcStatusResponse>> getMyNfcStatus(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(legalProfileService.getNfcStatus(currentUser.accountId())));
    }
}
