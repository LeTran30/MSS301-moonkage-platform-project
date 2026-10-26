package com.moonkage.vendor.service.impl;

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
import com.moonkage.vendor.mapper.VendorMapper;
import com.moonkage.vendor.repository.VendorRepository;
import com.moonkage.vendor.service.VendorService;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    @Override
    public UploadSlotResponse createUploadSlot(String accountId) {
        return null;
    }

    @Override
    public VendorResponse submit(String accountId, SubmitVendorRequest request) {
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VendorResponse> findByOwnerAccountId(String accountId) {
        return vendorRepository.findByOwnerAccountId(accountId).map(VendorMapper::toResponse);
    }

    @Override
    public List<VendorResponse> searchVendors(String role, String ownerAccountId, String status) {
        return List.of();
    }

    @Override
    public VendorResponse getVendor(String accountId, String role, String vendorId) {
        return null;
    }

    @Override
    public VendorResponse resubmit(String accountId, String vendorId, SubmitVendorRequest request) {
        return null;
    }

    @Override
    public VendorResponse update(String accountId, String role, String vendorId, UpdateVendorRequest request) {
        return null;
    }

    @Override
    public VendorDocumentLinkResponse getDocumentLink(
            String accountId, String role, String vendorId, String documentId) {
        return null;
    }

    @Override
    public VendorDocumentResponse createDocument(String role, String vendorId, CreateVendorDocumentRequest request) {
        return null;
    }

    @Override
    public List<OwnerCheckResponse> getOwnerChecks(String role, String vendorId) {
        return List.of();
    }

    @Override
    public List<VendorReviewResponse> getReviews(String role, String vendorId) {
        return List.of();
    }

    @Override
    public VendorReviewResponse createReview(
            String accountId, String role, String vendorId, CreateVendorReviewRequest request) {
        return null;
    }

    @Override
    public List<RegistrationFeePaymentResponse> getRegistrationFeePayments(String accountId, String vendorId) {
        return List.of();
    }

    @Override
    public RegistrationFeePaymentResponse createRegistrationFeePayment(String accountId, String vendorId) {
        return null;
    }
}
