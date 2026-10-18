package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.SubmitCardRequest;
import com.moonkage.identity.dto.response.ApiResponse;
import com.moonkage.identity.dto.response.NfcSessionCreateResponse;
import com.moonkage.identity.dto.response.NfcSessionStatusResponse;
import com.moonkage.identity.dto.response.SubmitCardResponse;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import com.moonkage.identity.service.NfcSessionService;
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
 * FR-04 NFC verification (Software Design 5.1, 7.7). The web creates the session and shows it as a QR; the Moonkage
 * Verify app, logged in to the same account, sends the card once. Every endpoint needs the JWT.
 */
@RestController
@RequestMapping("/api/nfc-sessions")
@RequiredArgsConstructor
public class NfcSessionController {

    private final NfcSessionService nfcSessionService;

    /** Web, AC-04.1. */
    @PostMapping
    public ResponseEntity<ApiResponse<NfcSessionCreateResponse>> create(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(nfcSessionService.createSession(currentUser.accountId())));
    }

    /** Web (fallback when the WebSocket push is missed) and app (before the tap). 410 expired, 403 not owned. */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<NfcSessionStatusResponse>> get(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(nfcSessionService.getSession(sessionId, currentUser.accountId())));
    }

    /** App, after the user taps Save. 200 also when rejected: see {@code data.status} and {@code data.reasonCode}. */
    @PostMapping("/{sessionId}/card")
    public ResponseEntity<ApiResponse<SubmitCardResponse>> submitCard(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String sessionId,
            @RequestBody SubmitCardRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(nfcSessionService.submitCard(sessionId, currentUser.accountId(), request)));
    }
}
