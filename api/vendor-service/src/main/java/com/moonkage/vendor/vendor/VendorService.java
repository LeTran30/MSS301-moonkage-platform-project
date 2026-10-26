package com.moonkage.vendor.vendor;

import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentResponse;
import com.moonkage.vendor.vendor.dto.response.UploadSlotResponse;
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

    UploadSlotResponse createUploadSlot(CurrentUserInfo caller);

    VendorResponse submit(CurrentUserInfo caller, SubmitVendorRequest request);

    /** For other services (GET /internal/vendors/by-owner); empty when the account owns no vendor. */
    Optional<VendorResponse> findByOwnerAccountId(String accountId);

    /** Both filters are optional; the admin lists applications by status (FR-45). */
    List<VendorResponse> searchVendors(CurrentUserInfo caller, String ownerAccountId, VendorStatus status);

    VendorResponse getVendor(CurrentUserInfo caller, String vendorId);

    VendorResponse resubmit(CurrentUserInfo caller, String vendorId, SubmitVendorRequest request);

    VendorResponse update(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request);

    VendorDocumentLinkResponse getDocumentLink(CurrentUserInfo caller, String vendorId, String documentId);

    VendorDocumentResponse createDocument(CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request);

    List<OwnerCheckResponse> getOwnerChecks(CurrentUserInfo caller, String vendorId);

    List<VendorReviewResponse> getReviews(CurrentUserInfo caller, String vendorId);

    VendorReviewResponse createReview(CurrentUserInfo caller, String vendorId, CreateVendorReviewRequest request);

    List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId);

    RegistrationFeePaymentResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId);
}
