package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.common.Roles;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.repository.QuoteRequestRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Who may read a request: its buyer, the owner of an invited vendor (AC-36.2) and an admin. Anyone else gets
 * REQUEST_NOT_FOUND, as if it did not exist, so request ids cannot be probed.
 */
@Component
@RequiredArgsConstructor
class RequestAccessPolicy {

    private final QuoteRequestRepository quoteRequestRepository;
    private final RequestInvitationRepository requestInvitationRepository;
    private final VendorDirectory vendorDirectory;

    QuoteRequest getRequest(String requestId) {
        return quoteRequestRepository
                .findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
    }

    QuoteRequest lockRequest(String requestId) {
        return quoteRequestRepository
                .findByIdForUpdate(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
    }

    Viewer viewerOf(String accountId, String role, QuoteRequest request) {
        if (request.isOwnedBy(accountId)) {
            return Viewer.buyer();
        }
        if (Roles.isAdmin(role)) {
            return Viewer.admin();
        }
        Optional<String> invitedVendorId = vendorDirectory
                .findOwnedBy(accountId)
                .map(VendorSnapshot::getVendorId)
                .filter(vendorId -> requestInvitationRepository
                        .findByRequestIdAndVendorId(request.getId(), vendorId)
                        .isPresent());
        return invitedVendorId.map(Viewer::vendor).orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
    }

    /** @param vendorId set only for a vendor viewer */
    record Viewer(Kind kind, String vendorId) {

        enum Kind {
            BUYER,
            VENDOR,
            ADMIN
        }

        static Viewer buyer() {
            return new Viewer(Kind.BUYER, null);
        }

        static Viewer admin() {
            return new Viewer(Kind.ADMIN, null);
        }

        static Viewer vendor(String vendorId) {
            return new Viewer(Kind.VENDOR, vendorId);
        }

        boolean isVendor() {
            return kind == Kind.VENDOR;
        }

        /** A vendor sees only its own invitation and quotes; buyer and admin see all. */
        boolean canSeeVendor(String otherVendorId) {
            return !isVendor() || vendorId.equals(otherVendorId);
        }
    }
}
