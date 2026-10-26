package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Operations still answering NOT_IMPLEMENTED come in phases 1 to 3 of docs/services/vendor/completion-plan.md. */
@Service
@RequiredArgsConstructor
class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    @Override
    public UploadSlotResponse createUploadSlot(CurrentUserInfo caller) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorResponse submit(CurrentUserInfo caller, SubmitVendorRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VendorResponse> findByOwnerAccountId(String accountId) {
        return vendorRepository.findByOwnerAccountId(accountId).map(VendorMapper::toResponse);
    }

    @Override
    public List<VendorResponse> searchVendors(CurrentUserInfo caller, String ownerAccountId, VendorStatus status) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorResponse getVendor(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorResponse resubmit(CurrentUserInfo caller, String vendorId, SubmitVendorRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorResponse update(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorDocumentLinkResponse getDocumentLink(CurrentUserInfo caller, String vendorId, String documentId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorDocumentResponse createDocument(
            CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public List<OwnerCheckResponse> getOwnerChecks(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public List<VendorReviewResponse> getReviews(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public VendorReviewResponse createReview(
            CurrentUserInfo caller, String vendorId, CreateVendorReviewRequest request) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }

    @Override
    public RegistrationFeePaymentResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId) {
        throw new AppException(ErrorCode.NOT_IMPLEMENTED);
    }
}
