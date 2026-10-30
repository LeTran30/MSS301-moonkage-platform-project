package com.moonkage.vendor.vendor;

import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import com.moonkage.storage.StorageProperties;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.client.dto.CheckIdNumberRequest;
import com.moonkage.vendor.client.dto.CheckIdNumberResponse;
import com.moonkage.vendor.client.dto.CreatePaymentRequest;
import com.moonkage.vendor.client.dto.CreatePaymentResponse;
import com.moonkage.vendor.client.dto.PaymentPurpose;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.outbox.OutboxService;
import com.moonkage.vendor.registrationfee.RegistrationFeeService;
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
import com.moonkage.vendor.vendor.vo.BankAccountNumber;
import com.moonkage.vendor.vendor.vo.DeliveryFee;
import com.moonkage.vendor.vendor.vo.IdNumber;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Vendor profile, submission, review, registration fee, delivery fee and lock (phases 1 to 3 of
 * docs/services/vendor/completion-plan.md). Every change other services copy ends with a snapshot
 * (vendor.updated / vendor.locked).
 */
@Service
@RequiredArgsConstructor
class VendorServiceImpl implements VendorService {

    // request fields named in errors, so the client shows each error at its field (FR-26)
    private static final String FIELD_ENTITY_TYPE = "entityType";
    private static final String FIELD_TAX_CODE = "taxCode";
    private static final String FIELD_PROVINCE_CODE = "provinceCode";
    private static final String FIELD_REPRESENTATIVE_NAME = "representativeName";
    private static final String FIELD_REPRESENTATIVE_ID_NUMBER = "representativeIdNumber";
    private static final String FIELD_BANK_ACCOUNT_NUMBER = "bankAccountNumber";
    private static final String FIELD_DOCUMENTS = "documents";
    private static final String FIELD_REASON = "reason";
    private static final String FIELD_KIND = "kind";
    private static final String FIELD_OBJECT_KEY = "objectKey";
    private static final String FIELD_LOCAL_DELIVERY_FEE = "localDeliveryFee";
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_STATUS_REASON = "statusReason";
    private static final String FIELD_LICENSE_CHECKED = "licenseChecked";
    private static final String FIELD_REGISTRY_CHECKED = "registryChecked";

    private final VendorRepository vendorRepository;
    private final VendorFinder vendorFinder;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final VendorSnapshotPublisher snapshotPublisher;
    private final VendorDocumentRepository documentRepository;
    private final VendorOwnerCheckRepository ownerCheckRepository;
    private final VendorReviewRepository reviewRepository;
    private final IdentityClient identityClient;
    private final PaymentClient paymentClient;
    private final RegistrationFeeService registrationFeeService;
    private final ObjectStorage objectStorage;
    private final StorageProperties storageProperties;
    private final VendorDocumentProperties documentProperties;
    private final BankAccountNumberCipher bankAccountNumberCipher;
    private final OutboxService outboxService;

    @Override
    public PresignedUploadLinkResponse createDocumentUploadLink(CurrentUserInfo caller, DocumentUploadRequest request) {
        PresignedUploadLink link = objectStorage.createPresignedUploadLink(
                request.contentType(), request.sizeBytes(), documentProperties.toFileLimit());
        return new PresignedUploadLinkResponse(link.tempKey(), link.uploadUrl(), link.formFields(), link.expiresAt());
    }

    @Override
    @Transactional
    public VendorDetailResponse submit(CurrentUserInfo caller, SubmitVendorRequest request) {
        if (caller.role() != Role.MEMBER) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        CheckedSubmission submission = check(request);
        OwnerCard ownerCard = getOwnerCard(caller.accountId(), submission.idNumber());
        if (vendorRepository.existsByOwnerAccountId(caller.accountId())) {
            throw new AppException(ErrorCode.VENDOR_ALREADY_EXISTS);
        }

        Vendor vendor = register(caller.accountId(), toProfile(request, submission, ownerCard));
        attachDocuments(vendor.getId(), request.documents(), Map.of());
        recordSubmission(vendor, submission.representativeName(), ownerCard);
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

    @Override
    @Transactional
    public VendorDetailResponse resubmit(CurrentUserInfo caller, String vendorId, SubmitVendorRequest request) {
        if (!vendorFinder.get(vendorId).isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        CheckedSubmission submission = check(request);
        OwnerCard ownerCard = getOwnerCard(caller.accountId(), submission.idNumber());

        // locked only now, not across the call to identity-service; the status check runs before any file moves
        Vendor vendor = vendorFinder.getForChange(vendorId);
        vendor.resubmit(toProfile(request, submission, ownerCard));
        attachDocuments(vendorId, request.documents(), getCurrentDocuments(vendorId));
        recordSubmission(vendor, submission.representativeName(), ownerCard);
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
        VendorDocument document = documentRepository
                .findByIdAndVendorId(documentId, vendorId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        String url = objectStorage.createPresignedDownloadUrl(document.getObjectKey());
        return new VendorDocumentLinkResponse(url, Instant.now().plus(storageProperties.downloadLinkLifetime()));
    }

    @Override
    @Transactional
    public VendorDocumentResponse createDocument(
            CurrentUserInfo caller, String vendorId, CreateVendorDocumentRequest request) {
        requireAdmin(caller);
        Vendor vendor = vendorFinder.get(vendorId);
        if (request.kind() != DocumentKind.FEE_INVOICE) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_KIND);
        }
        if (!vendor.isRegistrationFeePaid()) {
            throw new AppException(ErrorCode.REGISTRATION_FEE_NOT_PAID);
        }
        if (!objectStorage.isTempKey(request.objectKey())) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_OBJECT_KEY);
        }
        VendorDocument document = documentRepository.save(
                VendorDocument.of(vendorId, request.kind(), moveDocument(vendorId, request.objectKey())));
        return VendorMapper.toDocumentResponse(document);
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
        String reason = StringUtils.hasText(request.reason()) ? request.reason().trim() : null;
        checkReview(vendor, request, reason);

        vendor.decide(request.decision(), request.decision().requiresReason() ? reason : null);
        VendorReview review = reviewRepository.saveAndFlush(VendorReview.of(
                vendorId,
                caller.accountId(),
                request.decision(),
                reason,
                request.licenseChecked(),
                request.registryChecked()));
        VendorReviewedEvent event = VendorReviewedEvent.of(vendor, review, review.getDecidedAt());
        outboxService.enqueue(event.eventId(), RabbitConfig.VENDOR_REVIEWED_ROUTING_KEY, event);
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return VendorMapper.toReviewResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationFeePaymentResponse> getRegistrationFeePayments(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.getVisibleTo(caller, vendorId);
        if (!vendor.isRegistrationFeePaid()) {
            return List.of();
        }
        return List.of(new RegistrationFeePaymentResponse(
                vendor.getRegistrationFeePaymentId(),
                vendor.getRegistrationFeeAmount().value(),
                vendor.getRegistrationFeePaidAt()));
    }

    /** No transaction: nothing is written here, and none should stay open across the call to payment-service. */
    @Override
    public RegistrationFeePaymentLinkResponse createRegistrationFeePayment(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = vendorFinder.get(vendorId);
        if (!vendor.isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        vendor.checkRegistrationFeePayable();
        Price fee = registrationFeeService.getCurrentFee();
        CreatePaymentResponse payment = paymentClient.createPayment(
                new CreatePaymentRequest(PaymentPurpose.REGISTRATION_FEE, vendorId, caller.accountId(), fee.value()));
        return new RegistrationFeePaymentLinkResponse(payment.paymentId(), fee.value(), payment.paymentUrl());
    }

    /** Every format and completeness rule of a submission, before anything is called or stored (AC-26.1, AC-26.2). */
    private static CheckedSubmission check(SubmitVendorRequest request) {
        VendorEntityType entityType = atField(FIELD_ENTITY_TYPE, () -> toEntityType(request.entityType()));
        TaxCode taxCode = atField(FIELD_TAX_CODE, () -> TaxCode.of(request.taxCode()));
        ProvinceCode provinceCode = atField(FIELD_PROVINCE_CODE, () -> ProvinceCode.of(request.provinceCode()));
        RepresentativeName representativeName =
                atField(FIELD_REPRESENTATIVE_NAME, () -> RepresentativeName.of(request.representativeName()));
        IdNumber idNumber =
                atField(FIELD_REPRESENTATIVE_ID_NUMBER, () -> IdNumber.of(request.representativeIdNumber()));
        BankAccountNumber bankAccountNumber =
                atField(FIELD_BANK_ACCOUNT_NUMBER, () -> BankAccountNumber.of(request.bankAccountNumber()));
        if (!request.sellsShop() && !request.acceptsOrders()) {
            throw new AppException(ErrorCode.SELLING_MODE_REQUIRED);
        }
        checkDocumentKinds(request.documents());
        return new CheckedSubmission(
                entityType, taxCode, provinceCode, representativeName, idNumber, bankAccountNumber);
    }

    /** BR-33: only household businesses and sole proprietorships register through the system. */
    private static VendorEntityType toEntityType(String entityType) {
        return Arrays.stream(VendorEntityType.values())
                .filter(t -> t.name().equals(entityType))
                .findFirst()
                .orElseThrow(() -> new AppException(
                        ErrorCode.ENTITY_TYPE_NOT_ACCEPTED,
                        Arrays.stream(VendorEntityType.values()).map(Enum::name).collect(Collectors.joining(", "))));
    }

    /** One document of each kind the owner sends, nothing else (AC-26.1). */
    private static void checkDocumentKinds(List<SubmitVendorRequest.Document> documents) {
        Map<DocumentKind, Long> countByKind = documents.stream()
                .collect(Collectors.groupingBy(SubmitVendorRequest.Document::kind, Collectors.counting()));
        for (Map.Entry<DocumentKind, Long> entry : countByKind.entrySet()) {
            if (!DocumentKind.SUBMITTED_BY_OWNER.contains(entry.getKey()) || entry.getValue() > 1) {
                throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_DOCUMENTS);
            }
        }
        for (DocumentKind required : DocumentKind.SUBMITTED_BY_OWNER) {
            if (!countByKind.containsKey(required)) {
                throw new AppException(ErrorCode.DOCUMENT_REQUIRED, required.name()).atField(FIELD_DOCUMENTS);
            }
        }
    }

    /**
     * Asks identity-service to hash the declared ID number and compare it with the caller's verified card. No
     * verified card: BR-23, AC-26.5. Another person's number: BR-27, AC-26.6 (both entity types are owner-run).
     */
    private OwnerCard getOwnerCard(String accountId, IdNumber idNumber) {
        CheckIdNumberResponse check =
                identityClient.checkIdNumber(accountId, new CheckIdNumberRequest(idNumber.value()));
        if (!check.kycVerified()) {
            throw new AppException(ErrorCode.NFC_NOT_VERIFIED);
        }
        if (!check.matchesAccount()) {
            throw new AppException(ErrorCode.REPRESENTATIVE_NOT_OWNER).atField(FIELD_REPRESENTATIVE_ID_NUMBER);
        }
        return new OwnerCard(
                check.ownerLegalName(),
                check.ownerIdMasked(),
                check.nfcVerifiedAt(),
                check.matchesAccount(),
                new HashedIdNumber(check.idHash(), check.idHashKeyVer(), check.idMasked()));
    }

    private VendorProfile toProfile(SubmitVendorRequest request, CheckedSubmission submission, OwnerCard ownerCard) {
        BankAccount bankAccount = BankAccount.of(
                request.bankName().trim(),
                request.bankAccountHolder().trim(),
                bankAccountNumberCipher.encrypt(submission.bankAccountNumber()));
        return new VendorProfile(
                request.businessName().trim(),
                submission.entityType(),
                submission.taxCode(),
                request.address().trim(),
                submission.provinceCode(),
                submission.representativeName(),
                ownerCard.declaredIdNumber(),
                request.supplySource(),
                request.sellsShop(),
                request.acceptsOrders(),
                bankAccount);
    }

    /** The unique owner_account_id settles two first submissions racing past existsByOwnerAccountId. */
    private Vendor register(String ownerAccountId, VendorProfile profile) {
        try {
            return vendorRepository.saveAndFlush(Vendor.register(ownerAccountId, profile));
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.VENDOR_ALREADY_EXISTS);
        }
    }

    /**
     * A new upload (temp key) is checked and moved under the vendor's prefix and becomes the current document of its
     * kind; any other key must be the current document of that kind, which stays. Keys are all checked before the
     * first file moves.
     */
    private void attachDocuments(
            String vendorId,
            List<SubmitVendorRequest.Document> requested,
            Map<DocumentKind, VendorDocument> currentByKind) {
        List<SubmitVendorRequest.Document> uploads = new ArrayList<>();
        for (SubmitVendorRequest.Document document : requested) {
            if (objectStorage.isTempKey(document.objectKey())) {
                uploads.add(document);
            } else if (!isCurrent(document, currentByKind)) {
                throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_DOCUMENTS);
            }
        }
        for (SubmitVendorRequest.Document upload : uploads) {
            documentRepository.save(
                    VendorDocument.of(vendorId, upload.kind(), moveDocument(vendorId, upload.objectKey())));
        }
    }

    /** Checks the uploaded file and moves it under the vendor's prefix; returns its key there. */
    private String moveDocument(String vendorId, String tempKey) {
        return objectStorage.moveUploadedFile(
                tempKey,
                documentProperties.toFileLimit(),
                BucketAccess.PRIVATE,
                documentProperties.keyPrefixOf(vendorId));
    }

    private static boolean isCurrent(
            SubmitVendorRequest.Document document, Map<DocumentKind, VendorDocument> currentByKind) {
        VendorDocument current = currentByKind.get(document.kind());
        return current != null && current.getObjectKey().equals(document.objectKey());
    }

    /** The latest document of each kind (documents are never replaced in place). */
    private Map<DocumentKind, VendorDocument> getCurrentDocuments(String vendorId) {
        Map<DocumentKind, VendorDocument> currentByKind = new EnumMap<>(DocumentKind.class);
        for (VendorDocument document : documentRepository.findByVendorIdOrderByUploadedAtAsc(vendorId)) {
            currentByKind.put(document.getKind(), document);
        }
        return currentByKind;
    }

    /** AC-26.8: the owner check of this submission, then vendor.submitted for the admins. */
    private void recordSubmission(Vendor vendor, RepresentativeName representativeName, OwnerCard ownerCard) {
        int submissionNo = ownerCheckRepository
                .findFirstByVendorIdOrderBySubmissionNoDesc(vendor.getId())
                .map(previous -> previous.getSubmissionNo() + 1)
                .orElse(1);
        NameMatch nameMatch = NameMatch.of(representativeName.matches(ownerCard.legalName()));
        ownerCheckRepository.save(VendorOwnerCheck.of(vendor.getId(), submissionNo, ownerCard, nameMatch));

        VendorSubmittedEvent event =
                VendorSubmittedEvent.of(vendor.getId(), vendor.getOwnerAccountId(), submissionNo, Instant.now());
        outboxService.enqueue(event.eventId(), RabbitConfig.VENDOR_SUBMITTED_ROUTING_KEY, event);
    }

    /** AC-45.2 and AC-45.5, before the vendor's status is touched. */
    private static void checkReview(Vendor vendor, CreateVendorReviewRequest request, String reason) {
        if (request.decision().requiresReason() && reason == null) {
            throw new AppException(ErrorCode.REVIEW_REASON_REQUIRED).atField(FIELD_REASON);
        }
        if (request.decision() != ReviewDecision.APPROVE) {
            return;
        }
        List<String> missing = new ArrayList<>();
        if (!request.licenseChecked()) {
            missing.add(FIELD_LICENSE_CHECKED);
        }
        // A-14: only enterprises have a code on the national business registration portal
        if (vendor.getEntityType() == VendorEntityType.SOLE_PROPRIETORSHIP && !request.registryChecked()) {
            missing.add(FIELD_REGISTRY_CHECKED);
        }
        if (!missing.isEmpty()) {
            throw new AppException(ErrorCode.REVIEW_CONFIRMATION_REQUIRED, String.join(", ", missing));
        }
    }

    private VendorDetailResponse toDetailResponse(Vendor vendor, CurrentUserInfo caller) {
        List<VendorDocument> documents =
                List.copyOf(getCurrentDocuments(vendor.getId()).values());
        VendorOwnerCheck ownerCheck = caller.isAdmin()
                ? ownerCheckRepository
                        .findFirstByVendorIdOrderBySubmissionNoDesc(vendor.getId())
                        .orElse(null)
                : null;
        List<String> deliveryAreas = deliveryAreaRepository.findByVendorId(vendor.getId()).stream()
                .map(area -> area.getProvinceCode().value())
                .sorted()
                .toList();
        return VendorMapper.toDetailResponse(vendor, deliveryAreas, documents, ownerCheck);
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    /** Builds a value object from one request field; its error is reported at that field. */
    private static <T> T atField(String field, Supplier<T> valueObject) {
        try {
            return valueObject.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }

    /** A submission whose fields passed their format rules. */
    private record CheckedSubmission(
            VendorEntityType entityType,
            TaxCode taxCode,
            ProvinceCode provinceCode,
            RepresentativeName representativeName,
            IdNumber idNumber,
            BankAccountNumber bankAccountNumber) {}
}
