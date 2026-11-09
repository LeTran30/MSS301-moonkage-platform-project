package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.security.Role;
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
import com.moonkage.vendor.vendor.dto.response.VendorSummaryResponse;
import com.moonkage.vendor.vendor.elements.DeliveryFee;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Vendor profile, submission, review, registration fee, delivery fee and lock (phases 1 to 3 of
 * docs/archive/2026-10-26-vendor-completion-plan.md). Every change other services copy ends with a snapshot
 * (vendor.updated / vendor.locked).
 *
 * <p>This class is the façade the controllers call: it decides the order of the steps and who may do what. The
 * rules themselves live in the services it delegates to, each with one reason to change: {@link
 * VendorSubmissionService} (what a submission must pass), {@link VendorDocumentService} (the files), {@link
 * VendorReviewService} (the admin's decision) and {@link VendorFeePaymentService} (the registration fee).
 */
@Service
@RequiredArgsConstructor
class VendorServiceImpl implements VendorService {

    // request fields named in errors, so the client shows each error at its field (FR-26)
    private static final String FIELD_LOCAL_DELIVERY_FEE = "localDeliveryFee";
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_STATUS_REASON = "statusReason";

    private final VendorRepository vendorRepository;
    private final VendorFinder vendorFinder;
    private final DeliveryAreaReader deliveryAreaReader;
    private final VendorSnapshotPublisher snapshotPublisher;
    private final VendorOwnerCheckRepository ownerCheckRepository;
    private final VendorReviewRepository reviewRepository;
    private final VendorSubmissionService submissionService;
    private final VendorDocumentService documentService;
    private final VendorReviewService reviewService;
    private final VendorFeePaymentService feePaymentService;

    @Override
    public PresignedUploadLinkResponse createDocumentUploadLink(CurrentUserInfo caller, DocumentUploadRequest request) {
        return documentService.createUploadLink(request);
    }

    @Override
    @Transactional
    public VendorDetailResponse submit(CurrentUserInfo caller, SubmitVendorRequest request) {
        if (caller.role() != Role.MEMBER) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        VendorSubmissionService.PreparedSubmission prepared =
                submissionService.prepare(request, caller.accountId(), Set.of());
        if (vendorRepository.existsByOwnerAccountId(caller.accountId())) {
            throw new AppException(ErrorCode.VENDOR_ALREADY_EXISTS);
        }

        Vendor vendor = register(caller.accountId(), prepared.profile());
        documentService.attachDocuments(vendor.getId(), request.documents(), Map.of());
        submissionService.recordSubmission(vendor, prepared);
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return toDetailResponse(vendor, caller);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorView getView(String vendorId) {
        return VendorMapper.toView(vendorFinder.get(vendorId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VendorView> findByOwnerAccountId(String accountId) {
        return vendorRepository.findByOwnerAccountId(accountId).map(VendorMapper::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponse> searchVendors(CurrentUserInfo caller, String ownerAccountId, VendorStatus status) {
        if (!caller.isAdmin() && !caller.accountId().equals(ownerAccountId)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        List<Vendor> vendors;
        if (ownerAccountId != null) {
            vendors = vendorRepository.findByOwnerAccountId(ownerAccountId).stream()
                    .filter(v -> status == null || v.getStatus() == status)
                    .toList();
        } else if (status != null) {
            vendors = vendorRepository.findByStatusOrderByCreatedAtAsc(status);
        } else {
            vendors = vendorRepository.findAllByOrderByCreatedAtAsc();
        }
        return vendors.stream().map(VendorMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDetailResponse getVendor(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.getVisibleTo(caller, vendorId);
        return toDetailResponse(vendor, caller);
    }

    /**
     * The public summary of a shop (B-3.2). No ownership check: this read is open to guests, which is why it answers
     * only the safe fields of {@link VendorSummaryResponse} and never the private profile.
     */
    @Override
    @Transactional(readOnly = true)
    public VendorSummaryResponse getSummary(String vendorId) {
        Vendor vendor = vendorFinder.get(vendorId);
        List<String> deliveryAreas = deliveryAreaReader.provinceCodesOf(vendor.getId());
        return VendorMapper.toSummaryResponse(vendor, deliveryAreas);
    }

    @Override
    @Transactional
    public VendorDetailResponse resubmit(CurrentUserInfo caller, String vendorId, SubmitVendorRequest request) {
        if (!vendorFinder.get(vendorId).isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        Map<DocumentKind, VendorDocument> currentDocuments = documentService.currentDocuments(vendorId);
        VendorSubmissionService.PreparedSubmission prepared =
                submissionService.prepare(request, caller.accountId(), currentDocuments.keySet());

        // locked only now, not across the call to identity-service; the status check runs before any file moves
        Vendor vendor = vendorFinder.getForChange(vendorId);
        vendor.resubmit(prepared.profile());
        documentService.attachDocuments(vendorId, request.documents(), currentDocuments);
        submissionService.recordSubmission(vendor, prepared);
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return toDetailResponse(vendor, caller);
    }

    @Override
    @Transactional
    public VendorDetailResponse update(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request) {
        if (caller.isAdmin()) {
            return lock(caller, vendorId, request);
        }
        if (request.status() != null || request.statusReason() != null) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        DeliveryFee fee = atField(FIELD_LOCAL_DELIVERY_FEE, () -> DeliveryFee.of(request.localDeliveryFee()));
        Vendor vendor = vendorFinder.getForOwnerChange(caller, vendorId);
        vendor.changeLocalDeliveryFee(fee);
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return toDetailResponse(vendor, caller);
    }

    /** FR-46: only LOCKED, with a reason (AC-46.2); the admin and the time travel on vendor.locked for the audit. */
    private VendorDetailResponse lock(CurrentUserInfo caller, String vendorId, UpdateVendorRequest request) {
        if (request.localDeliveryFee() != null) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (request.status() != VendorStatus.LOCKED) {
            throw new AppException(ErrorCode.INVALID_INPUT).atField(FIELD_STATUS);
        }
        if (!StringUtils.hasText(request.statusReason())) {
            throw new AppException(ErrorCode.LOCK_REASON_REQUIRED).atField(FIELD_STATUS_REASON);
        }
        Vendor vendor = vendorFinder.getForChange(vendorId);
        vendor.lock(request.statusReason().trim());
        snapshotPublisher.announceLocked(vendor, caller.accountId());
        return toDetailResponse(vendor, caller);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDocumentLinkResponse getDocumentLink(CurrentUserInfo caller, String vendorId, String documentId) {
        vendorFinder.getVisibleTo(caller, vendorId);
        VendorDocument document = documentService
                .findByIdAndVendorId(documentId, vendorId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        return documentService.createDownloadLink(document);
    }

    @Override
    @Transactional
    public VendorDocumentResponse createDocument(
            CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request) {
        requireAdmin(caller);
        Vendor vendor = vendorFinder.get(vendorId);
        return documentService.attachAdminDocument(vendor, request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerCheckResponse> getOwnerChecks(CurrentUserInfo caller, String vendorId) {
        requireAdmin(caller);
        vendorFinder.get(vendorId);
        return ownerCheckRepository.findByVendorIdOrderBySubmissionNoAsc(vendorId).stream()
                .map(VendorMapper::toOwnerCheckResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorReviewResponse> getReviews(CurrentUserInfo caller, String vendorId) {
        requireAdmin(caller);
        vendorFinder.get(vendorId);
        return reviewRepository.findByVendorIdOrderByDecidedAtAsc(vendorId).stream()
                .map(VendorMapper::toReviewResponse)
                .toList();
    }

    @Override
    @Transactional
    public VendorReviewResponse createReview(
            CurrentUserInfo caller, String vendorId, CreateVendorReviewRequest request) {
        requireAdmin(caller);
        Vendor vendor = vendorFinder.getForChange(vendorId);
        return reviewService.decide(vendor, caller.accountId(), request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.getVisibleTo(caller, vendorId);
        return feePaymentService.paymentsOf(vendor);
    }

    /** No transaction: nothing is written here, and none should stay open across the call to payment-service. */
    @Override
    public RegistrationFeePaymentLinkResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.get(vendorId);
        return feePaymentService.startPayment(vendor, caller);
    }

    /** The unique owner_account_id settles two first submissions racing past existsByOwnerAccountId. */
    private Vendor register(String ownerAccountId, VendorProfile profile) {
        try {
            return vendorRepository.saveAndFlush(Vendor.register(ownerAccountId, profile));
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.VENDOR_ALREADY_EXISTS);
        }
    }

    private VendorDetailResponse toDetailResponse(Vendor vendor, CurrentUserInfo caller) {
        List<VendorDocument> documents =
                List.copyOf(documentService.currentDocuments(vendor.getId()).values());
        VendorOwnerCheck ownerCheck = caller.isAdmin()
                ? ownerCheckRepository
                        .findFirstByVendorIdOrderBySubmissionNoDesc(vendor.getId())
                        .orElse(null)
                : null;
        List<String> deliveryAreas = deliveryAreaReader.provinceCodesOf(vendor.getId());
        return VendorMapper.toDetailResponse(vendor, deliveryAreas, documents, ownerCheck);
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    /** Builds a value object from one request field; its error is reported at that field. */
    private static <T> T atField(String field, java.util.function.Supplier<T> valueObject) {
        try {
            return valueObject.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }
}
