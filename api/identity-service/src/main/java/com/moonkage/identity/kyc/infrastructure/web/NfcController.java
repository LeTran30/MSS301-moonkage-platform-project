package com.moonkage.identity.kyc.infrastructure.web;

import com.moonkage.identity.kyc.application.CreateNfcSession;
import com.moonkage.identity.kyc.application.GetKycStatus;
import com.moonkage.identity.kyc.application.GetNfcSession;
import com.moonkage.identity.kyc.application.SubmitNfcCard;
import com.moonkage.identity.kyc.domain.nfc.NfcSessionId;
import com.moonkage.identity.kyc.infrastructure.web.NfcSessionResponses.CardResult;
import com.moonkage.identity.kyc.infrastructure.web.NfcSessionResponses.Created;
import com.moonkage.identity.kyc.infrastructure.web.NfcSessionResponses.Status;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR-04 KYC by NFC (Software Design 5.1, 7.7): the web creates a session and shows it as a QR; the Moonkage Verify
 * app, logged in to the same account, sends the card once. Every endpoint needs the JWT.
 */
@RestController
@RequiredArgsConstructor
class NfcController {

    private final CreateNfcSession createNfcSession;
    private final GetNfcSession getNfcSession;
    private final SubmitNfcCard submitNfcCard;
    private final GetKycStatus getKycStatus;

    /** Web, AC-04.1. */
    @PostMapping("/api/nfc/sessions")
    ResponseEntity<ApiResponse<Created>> createSession(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(Created.from(createNfcSession.handle(currentUser.accountId()))));
    }

    /** Web (fallback when the push is missed) and app (before the tap). 410 expired, 403 not owned. */
    @GetMapping("/api/nfc/sessions/{sessionId}")
    ResponseEntity<ApiResponse<Status>> getSession(
            @CurrentUser CurrentUserInfo currentUser, @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                Status.from(getNfcSession.handle(new NfcSessionId(sessionId), currentUser.accountId()))));
    }

    /** App, after the user taps Save. 200 also when rejected: see {@code data.status} and {@code data.reasonCode}. */
    @PostMapping("/api/nfc/sessions/{sessionId}/card")
    ResponseEntity<ApiResponse<CardResult>> submitCard(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String sessionId,
            @RequestBody SubmitCardRequest request) {
        SubmitNfcCard.Command command = request.toCommand(new NfcSessionId(sessionId), currentUser.accountId());
        return ResponseEntity.ok(ApiResponse.ok(CardResult.from(submitNfcCard.handle(command))));
    }

    /** KYC standing of the caller's own account, masked data only. */
    @GetMapping("/api/nfc/status")
    ResponseEntity<ApiResponse<KycStatusResponse>> getMyStatus(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(KycStatusResponse.from(getKycStatus.handle(currentUser.accountId()))));
    }
}
