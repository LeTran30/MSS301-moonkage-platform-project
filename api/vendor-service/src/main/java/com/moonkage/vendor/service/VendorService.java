package com.moonkage.vendor.service;

import com.moonkage.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.dto.response.RegistrationFeePaymentResponse;
import com.moonkage.vendor.dto.response.UploadSlotResponse;
import com.moonkage.vendor.dto.response.VendorDocumentLinkResponse;
import com.moonkage.vendor.dto.response.VendorDocumentResponse;
import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.dto.response.VendorReviewResponse;
import java.util.List;
import java.util.Optional;

/** {@code role} comes from the gateway (X-User-Role); endpoints open to both seller and admin decide on it. */
public interface VendorService {

    UploadSlotResponse createUploadSlot(String accountId);

    VendorResponse submit(String accountId, SubmitVendorRequest request);

    Optional<VendorResponse> findByOwnerAccountId(String accountId);

    /** Both filters are optional; the admin lists applications by status (FR-45). */
    List<VendorResponse> searchVendors(String role, String ownerAccountId, String status);

    VendorResponse getVendor(String accountId, String role, String vendorId);

    VendorResponse resubmit(String accountId, String vendorId, SubmitVendorRequest request);

    VendorResponse update(String accountId, String role, String vendorId, UpdateVendorRequest request);

    VendorDocumentLinkResponse getDocumentLink(String accountId, String role, String vendorId, String documentId);

    VendorDocumentResponse createDocument(String role, String vendorId, CreateVendorDocumentRequest request);

    List<OwnerCheckResponse> getOwnerChecks(String role, String vendorId);

    List<VendorReviewResponse> getReviews(String role, String vendorId);

    VendorReviewResponse createReview(
            String accountId, String role, String vendorId, CreateVendorReviewRequest request);

    List<RegistrationFeePaymentResponse> getRegistrationFeePayments(String accountId, String vendorId);

    RegistrationFeePaymentResponse createRegistrationFeePayment(String accountId, String vendorId);
}
