package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.request.DocumentUploadRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDetailResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentLinkResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentResponse;
import com.moonkage.vendor.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.vendor.dto.response.VendorReviewResponse;
import java.util.List;
import java.util.Optional;

/**
 * Root Vendor (docs/architecture/api-db/vendor.md). {@code caller} is who sends the request; the service checks
 * the role and the ownership, so one path serves seller and admin (API rule 4).
 */
public interface VendorService {

    /** Presigned upload of a legal document to the private bucket (AC-26.1); members only. */
    PresignedUploadLinkResponse createDocumentUploadLink(CurrentUserInfo caller, DocumentUploadRequest request);

    /** FR-26: the caller becomes the owner of a new pending vendor (BR-23, BR-27, BR-33). */
    VendorDetailResponse submit(CurrentUserInfo caller, SubmitVendorRequest request);

    /** For other services (GET /internal/vendors/by-owner); empty when the account owns no vendor. */
    Optional<VendorResponse> findByOwnerAccountId(String accountId);

    /**
     * A member sees only their own vendor ({@code ownerAccountId} = themselves, FR-27); the admin filters by owner
     * and/or status (FR-45). Oldest first.
     */
    List<VendorResponse> searchVendors(CurrentUserInfo caller, String ownerAccountId, VendorStatus status);

    /** The owner or an admin; the admin also gets the owner check of the latest submission (AC-45.1, AC-45.4). */
    VendorDetailResponse getVendor(CurrentUserInfo caller, String vendorId);

    /** AC-27.2: the owner, while NEEDS_INFO or REJECTED; every check of a first submission runs again. */
    VendorDetailResponse resubmit(CurrentUserInfo caller, String vendorId, SubmitVendorRequest request);

    VendorResponse update(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request);

    /** Short-lived link to one document of the vendor, for its owner or an admin (AC-27.6, NFR-03). */
    VendorDocumentLinkResponse getDocumentLink(CurrentUserInfo caller, String vendorId, String documentId);

    VendorDocumentResponse createDocument(CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request);

    /** Admin only, every submission in order (AC-45.4). */
    List<OwnerCheckResponse> getOwnerChecks(CurrentUserInfo caller, String vendorId);

    /** Admin only, oldest first. */
    List<VendorReviewResponse> getReviews(CurrentUserInfo caller, String vendorId);

    /** Admin only: decides a pending profile and moves the vendor to the decided status (AC-45.2 → AC-45.5). */
    VendorReviewResponse createReview(CurrentUserInfo caller, String vendorId, CreateVendorReviewRequest request);

    List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId);

    RegistrationFeePaymentResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId);
}
