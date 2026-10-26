package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.request.DocumentUploadRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentLinkResponse;
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

    /**
     * Presigned upload to the private bucket: an owner's legal document (AC-26.1) or the admin's fee invoice (Q-36).
     * The file belongs to nothing until it is attached.
     */
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

    /**
     * The owner sets its delivery fee (FR-28, AC-28.3); an admin locks an approved vendor with a reason (FR-46).
     * Any other field from either is refused.
     */
    VendorDetailResponse update(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request);

    /** Short-lived link to one document of the vendor, for its owner or an admin (AC-27.6, NFR-03). */
    VendorDocumentLinkResponse getDocumentLink(CurrentUserInfo caller, String vendorId, String documentId);

    /** Admin only: attaches the registration fee invoice of a vendor that paid (Q-36); its owner can open it. */
    VendorDocumentResponse createDocument(CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request);

    /** Admin only, every submission in order (AC-45.4). */
    List<OwnerCheckResponse> getOwnerChecks(CurrentUserInfo caller, String vendorId);

    /** Admin only, oldest first. */
    List<VendorReviewResponse> getReviews(CurrentUserInfo caller, String vendorId);

    /** Admin only: decides a pending profile and moves the vendor to the decided status (AC-45.2 → AC-45.5). */
    VendorReviewResponse createReview(CurrentUserInfo caller, String vendorId, CreateVendorReviewRequest request);

    /** The owner or an admin; empty until paid, then the one payment that settled it (BR-31). */
    List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId);

    /**
     * The owner, once approved and not yet paid (AC-27.4): a payment at the level in effect now (AC-53.3). The fee is
     * recorded when payment.succeeded arrives, not here.
     */
    RegistrationFeePaymentLinkResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId);
}
