package com.moonkage.quotation.controller;

import com.moonkage.quotation.common.exception.ApiResponse;
import com.moonkage.quotation.dto.request.AcceptQuoteRequest;
import com.moonkage.quotation.dto.request.CreateQuoteRequestRequest;
import com.moonkage.quotation.dto.request.SubmitQuoteRequest;
import com.moonkage.quotation.dto.request.UpdateInvitationRequest;
import com.moonkage.quotation.dto.request.UpdateQuoteRequest;
import com.moonkage.quotation.dto.response.AcceptQuoteResponse;
import com.moonkage.quotation.dto.response.AcceptanceResponse;
import com.moonkage.quotation.dto.response.InvitationResponse;
import com.moonkage.quotation.dto.response.QuoteRequestResponse;
import com.moonkage.quotation.dto.response.QuoteResponse;
import com.moonkage.quotation.service.QuoteAcceptanceService;
import com.moonkage.quotation.service.QuoteRequestService;
import com.moonkage.quotation.service.QuoteService;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Root QuoteRequest with its invitations, quotes and acceptance (docs/architecture/api-db/quotation.md). One path for
 * every role: the service decides from X-Account-Id whether the caller is the buyer, an invited vendor's owner or an
 * admin. X-Account-Id and X-User-Role come from the gateway, taken from the access token.
 */
@RestController
@RequestMapping("/api/quote-requests")
@RequiredArgsConstructor
public class QuoteRequestController {

    private final QuoteRequestService quoteRequestService;
    private final QuoteService quoteService;
    private final QuoteAcceptanceService quoteAcceptanceService;

    /** FR-15 (type DIRECT), FR-16 (type OPEN). Needs a verified NFC (BR-23). */
    @PostMapping
    public ResponseEntity<ApiResponse<QuoteRequestResponse>> create(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Valid @RequestBody CreateQuoteRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(quoteRequestService.create(accountId, request)));
    }

    /** No vendorId: the caller's own requests (AC-16.3). vendorId: requests sent to the caller's vendor (FR-36). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<QuoteRequestResponse>>> searchRequests(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(quoteRequestService.searchRequests(accountId, role, vendorId)));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<QuoteRequestResponse>> getRequest(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String requestId) {
        return ResponseEntity.ok(ApiResponse.ok(quoteRequestService.getRequest(accountId, role, requestId)));
    }

    @GetMapping("/{requestId}/invitations")
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getInvitations(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String requestId) {
        return ResponseEntity.ok(ApiResponse.ok(quoteRequestService.getInvitations(accountId, role, requestId)));
    }

    /** {@code {"status": "DECLINED", "declineReason": "..."}} (AC-36.3). */
    @PatchMapping("/{requestId}/invitations/{vendorId}")
    public ResponseEntity<ApiResponse<InvitationResponse>> updateInvitation(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String requestId,
            @PathVariable String vendorId,
            @Valid @RequestBody UpdateInvitationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(quoteRequestService.updateInvitation(accountId, requestId, vendorId, request)));
    }

    /** The comparison table for the buyer (FR-17); a vendor sees only its own quote. */
    @GetMapping("/{requestId}/quotes")
    public ResponseEntity<ApiResponse<List<QuoteResponse>>> getQuotes(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String requestId) {
        return ResponseEntity.ok(ApiResponse.ok(quoteService.getQuotes(accountId, role, requestId)));
    }

    /** FR-38. The server computes totals, deposit and remainder; supersedesQuoteId sends a new revision (BR-05). */
    @PostMapping("/{requestId}/quotes")
    public ResponseEntity<ApiResponse<QuoteResponse>> submitQuote(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String requestId,
            @Valid @RequestBody SubmitQuoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(quoteService.submit(accountId, requestId, request)));
    }

    @GetMapping("/{requestId}/quotes/{quoteId}")
    public ResponseEntity<ApiResponse<QuoteResponse>> getQuote(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String requestId,
            @PathVariable String quoteId,
            @RequestParam(defaultValue = "false") boolean includeRevisions) {
        return ResponseEntity.ok(
                ApiResponse.ok(quoteService.getQuote(accountId, role, requestId, quoteId, includeRevisions)));
    }

    /** {@code {"status": "WITHDRAWN"}}: the only change to a sent quote (BR-05). */
    @PatchMapping("/{requestId}/quotes/{quoteId}")
    public ResponseEntity<ApiResponse<QuoteResponse>> updateQuote(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String requestId,
            @PathVariable String quoteId,
            @Valid @RequestBody UpdateQuoteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(quoteService.update(accountId, requestId, quoteId, request)));
    }

    /** FR-19: freezes the binding copy and returns where to pay the deposit. */
    @PostMapping("/{requestId}/quotes/{quoteId}/acceptance")
    public ResponseEntity<ApiResponse<AcceptQuoteResponse>> accept(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String requestId,
            @PathVariable String quoteId,
            @Valid @RequestBody(required = false) AcceptQuoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(quoteAcceptanceService.accept(accountId, requestId, quoteId, request)));
    }

    @GetMapping("/{requestId}/quotes/{quoteId}/acceptance")
    public ResponseEntity<ApiResponse<AcceptanceResponse>> getAcceptance(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String requestId,
            @PathVariable String quoteId) {
        return ResponseEntity.ok(
                ApiResponse.ok(quoteAcceptanceService.getAcceptance(accountId, role, requestId, quoteId)));
    }
}
