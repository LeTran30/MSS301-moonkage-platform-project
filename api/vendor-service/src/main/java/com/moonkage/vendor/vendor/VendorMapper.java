package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDetailResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentResponse;
import com.moonkage.vendor.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.vendor.dto.response.VendorReviewResponse;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;
import java.util.List;
import java.util.function.Function;

/** Entity → DTO for the vendor component. DTOs must not depend on entities (ArchitectureTest). */
final class VendorMapper {

    private VendorMapper() {}

    static VendorResponse toResponse(Vendor v) {
        return new VendorResponse(
                v.getId(),
                v.getOwnerAccountId(),
                v.getBusinessName(),
                v.getStatus().name(),
                v.getSupplySource().name(),
                v.isSellsShop(),
                v.isAcceptsOrders());
    }

    /** @param ownerCheck null when the caller may not see it */
    static VendorDetailResponse toDetailResponse(
            Vendor v, List<VendorDocument> documents, VendorOwnerCheck ownerCheck) {
        return new VendorDetailResponse(
                v.getId(),
                v.getOwnerAccountId(),
                v.getBusinessName(),
                v.getEntityType(),
                valueOf(v.getTaxCode(), TaxCode::value),
                v.getAddress(),
                valueOf(v.getProvinceCode(), ProvinceCode::value),
                valueOf(v.getRepresentativeName(), RepresentativeName::value),
                v.getRepresentativeIdMasked(),
                v.getSupplySource(),
                v.isSellsShop(),
                v.isAcceptsOrders(),
                toBankAccount(v.getBankAccount()),
                v.getStatus(),
                v.getStatusReason(),
                v.canOperate(),
                v.getLocalDeliveryFee(),
                v.getRegistrationFeePaidAt(),
                documents.stream().map(VendorMapper::toDocumentResponse).toList(),
                ownerCheck == null ? null : toOwnerCheckResponse(ownerCheck),
                v.getCreatedAt(),
                v.getUpdatedAt());
    }

    static VendorDocumentResponse toDocumentResponse(VendorDocument d) {
        return new VendorDocumentResponse(d.getId(), d.getKind(), d.getUploadedAt());
    }

    static OwnerCheckResponse toOwnerCheckResponse(VendorOwnerCheck c) {
        return new OwnerCheckResponse(
                c.getSubmissionNo(),
                c.getOwnerLegalName(),
                c.getOwnerIdMasked(),
                c.getNfcVerifiedAt(),
                c.isIdMatch(),
                c.getNameMatch(),
                c.getCheckedAt());
    }

    static VendorReviewResponse toReviewResponse(VendorReview r) {
        return new VendorReviewResponse(
                r.getId(),
                r.getAdminAccountId(),
                r.getDecision(),
                r.getReason(),
                r.isLicenseChecked(),
                r.isRegistryChecked(),
                r.getDecidedAt());
    }

    private static VendorDetailResponse.BankAccount toBankAccount(BankAccount b) {
        return b == null
                ? null
                : new VendorDetailResponse.BankAccount(b.getBankName(), b.getMaskedNumber(), b.getHolder());
    }

    /** Value objects travel as their plain value; a row from before the profile was required may hold null. */
    private static <T> String valueOf(T valueObject, Function<T, String> value) {
        return valueObject == null ? null : value.apply(valueObject);
    }
}
