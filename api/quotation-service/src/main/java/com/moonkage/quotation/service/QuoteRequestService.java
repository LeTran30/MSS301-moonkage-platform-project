package com.moonkage.quotation.service;

import com.moonkage.quotation.dto.request.CreateQuoteRequestRequest;
import com.moonkage.quotation.dto.request.UpdateInvitationRequest;
import com.moonkage.quotation.dto.response.InvitationResponse;
import com.moonkage.quotation.dto.response.QuoteRequestResponse;
import java.util.List;

/** Root QuoteRequest and its invitations (docs/architecture/api-db/quotation.md). */
public interface QuoteRequestService {

    QuoteRequestResponse create(String accountId, CreateQuoteRequestRequest request);

    /**
     * Without vendorId: the caller's own requests (an admin sees all). With vendorId: the requests sent to that
     * vendor, which the caller must own.
     */
    List<QuoteRequestResponse> searchRequests(String accountId, String role, String vendorId);

    QuoteRequestResponse getRequest(String accountId, String role, String requestId);

    List<InvitationResponse> getInvitations(String accountId, String role, String requestId);

    InvitationResponse updateInvitation(
            String accountId, String requestId, String vendorId, UpdateInvitationRequest request);
}
