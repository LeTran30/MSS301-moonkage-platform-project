package com.moonkage.vendor.vendor.dto.request;

import com.moonkage.vendor.vendor.DocumentKind;
import com.moonkage.vendor.vendor.SupplySource;
import com.moonkage.vendor.vendor.VendorConstant;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Vendor profile, used for the first submission (FR-26) and for resubmitting (AC-27.2). Fields with a format of their
 * own (tax code, province, representative name and ID number, bank account number) are checked by their value
 * objects; an error names the field. {@code representativeIdNumber} and {@code bankAccountNumber} are never logged:
 * {@link #toString()} leaves them out.
 *
 * @param entityType HOUSEHOLD_BUSINESS or SOLE_PROPRIETORSHIP; a company is refused with its own message (BR-33)
 */
public record SubmitVendorRequest(
        @NotBlank(message = "{validation.required}")
        @Size(max = VendorConstant.TEXT_MAX_LENGTH, message = "{validation.too_long}")
        String businessName,

        @NotBlank(message = "{validation.required}") String entityType,
        @NotBlank(message = "{validation.required}") String taxCode,

        @NotBlank(message = "{validation.required}")
        @Size(max = VendorConstant.TEXT_MAX_LENGTH, message = "{validation.too_long}")
        String address,

        @NotBlank(message = "{validation.required}") String provinceCode,
        @NotBlank(message = "{validation.required}") String representativeName,
        @NotBlank(message = "{validation.required}") String representativeIdNumber,
        @NotNull(message = "{validation.required}") SupplySource supplySource,
        boolean sellsShop,
        boolean acceptsOrders,

        @NotBlank(message = "{validation.required}")
        @Size(max = VendorConstant.TEXT_MAX_LENGTH, message = "{validation.too_long}")
        String bankName,

        @NotBlank(message = "{validation.required}") String bankAccountNumber,

        @NotBlank(message = "{validation.required}")
        @Size(max = VendorConstant.TEXT_MAX_LENGTH, message = "{validation.too_long}")
        String bankAccountHolder,

        @NotEmpty(message = "{validation.required}") List<@Valid @NotNull Document> documents) {

    private static final String HIDDEN = "***";

    /**
     * @param objectKey tempKey from POST /api/vendors/uploads, or, when resubmitting, the key of a current document
     *     of the same kind that stays as it is
     */
    public record Document(
            @NotNull(message = "{validation.required}") DocumentKind kind,
            @NotBlank(message = "{validation.required}") String objectKey) {}

    @Override
    public String toString() {
        return "SubmitVendorRequest[businessName=" + businessName + ", entityType=" + entityType + ", taxCode="
                + taxCode + ", representativeIdNumber=" + HIDDEN + ", bankAccountNumber=" + HIDDEN + ", documents="
                + documents + "]";
    }
}
