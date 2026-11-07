package com.moonkage.vendor.vendor;

import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.dto.CheckIdNumberRequest;
import com.moonkage.vendor.client.dto.CheckIdNumberResponse;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.outbox.OutboxService;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.elements.BankAccountNumber;
import com.moonkage.vendor.vendor.elements.IdNumber;
import com.moonkage.vendor.vendor.elements.RepresentativeName;
import com.moonkage.vendor.vendor.elements.TaxCode;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * What one submission means: the rules its fields must pass (AC-26.1, AC-26.2), the owner it claims (BR-23, BR-27)
 * and the owner check that is recorded for it (AC-26.8).
 *
 * <p>Split out of {@link VendorServiceImpl} because the acceptance rules of a submission and the call to
 * identity-service they need change together: a rule that needs another field of the owner's card belongs here, not
 * in the façade that only orchestrates the use cases.
 */
@Component
@RequiredArgsConstructor
class VendorSubmissionService {

    // request fields named in errors, so the client shows each error at its field (FR-26)
    private static final String FIELD_ENTITY_TYPE = "entityType";
    private static final String FIELD_TAX_CODE = "taxCode";
    private static final String FIELD_PROVINCE_CODE = "provinceCode";
    private static final String FIELD_REPRESENTATIVE_NAME = "representativeName";
    private static final String FIELD_REPRESENTATIVE_ID_NUMBER = "representativeIdNumber";
    private static final String FIELD_BANK_ACCOUNT_NUMBER = "bankAccountNumber";
    private static final String FIELD_DOCUMENTS = "documents";

    private final IdentityClient identityClient;
    private final BankAccountNumberCipher bankAccountNumberCipher;
    private final VendorOwnerCheckRepository ownerCheckRepository;
    private final OutboxService outboxService;

    /**
     * Checks the request and asks identity-service about the owner's card, so a submission that is stored is one that
     * already passed every rule.
     */
    PreparedSubmission prepare(SubmitVendorRequest request, String accountId) {
        CheckedSubmission checked = check(request);
        OwnerCard ownerCard = getOwnerCard(accountId, checked.idNumber());
        return new PreparedSubmission(toProfile(request, checked, ownerCard), ownerCard);
    }

    /** AC-26.8: the owner check of this submission, then vendor.submitted for the admins. */
    void recordSubmission(Vendor vendor, PreparedSubmission prepared) {
        int submissionNo = ownerCheckRepository
                .findFirstByVendorIdOrderBySubmissionNoDesc(vendor.getId())
                .map(previous -> previous.getSubmissionNo() + 1)
                .orElse(1);
        NameMatch nameMatch = NameMatch.of(prepared.profile()
                .representativeName()
                .matches(prepared.ownerCard().legalName()));
        ownerCheckRepository.save(VendorOwnerCheck.of(vendor.getId(), submissionNo, prepared.ownerCard(), nameMatch));

        VendorSubmittedEvent event =
                VendorSubmittedEvent.of(vendor.getId(), vendor.getOwnerAccountId(), submissionNo, Instant.now());
        outboxService.enqueue(event.eventId(), RabbitConfig.VENDOR_SUBMITTED_ROUTING_KEY, event);
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
                identityClient.checkIdNumber(new CheckIdNumberRequest(accountId, idNumber.value()));
        if (check.nfcVerifiedAt() == null) {
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

    private VendorProfile toProfile(SubmitVendorRequest request, CheckedSubmission checked, OwnerCard ownerCard) {
        BankAccount bankAccount = BankAccount.of(
                request.bankName().trim(),
                request.bankAccountHolder().trim(),
                bankAccountNumberCipher.encrypt(checked.bankAccountNumber()));
        return new VendorProfile(
                request.businessName().trim(),
                checked.entityType(),
                checked.taxCode(),
                request.address().trim(),
                checked.provinceCode(),
                checked.representativeName(),
                ownerCard.declaredIdNumber(),
                request.supplySource(),
                request.sellsShop(),
                request.acceptsOrders(),
                bankAccount);
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

    /** A checked submission, with the profile it becomes and the owner's card it was checked against. */
    record PreparedSubmission(VendorProfile profile, OwnerCard ownerCard) {}
}
