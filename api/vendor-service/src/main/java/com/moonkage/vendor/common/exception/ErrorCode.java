package com.moonkage.vendor.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INTERNAL_SERVER_ERROR("COMMON_500", HttpStatus.INTERNAL_SERVER_ERROR, "error.common.internal"),
    INVALID_INPUT("COMMON_400", HttpStatus.BAD_REQUEST, "error.common.invalid_input"),
    MALFORMED_JSON("COMMON_400_JSON", HttpStatus.BAD_REQUEST, "error.common.malformed_json"),
    PROVINCE_CODE_INVALID("COMMON_400_PROVINCE", HttpStatus.BAD_REQUEST, "error.common.province_code_invalid"),
    PRICE_INVALID("COMMON_400_PRICE", HttpStatus.BAD_REQUEST, "error.common.price_invalid"),
    QUANTITY_INVALID("COMMON_400_QUANTITY", HttpStatus.BAD_REQUEST, "error.common.quantity_invalid"),
    PRICE_TIERS_INVALID("COMMON_400_PRICE_TIERS", HttpStatus.BAD_REQUEST, "error.common.price_tiers_invalid"),
    /** No X-Account-Id / X-User-Role: the call did not come through the gateway with a token. */
    UNAUTHENTICATED("COMMON_401", HttpStatus.UNAUTHORIZED, "error.common.unauthenticated"),
    ACCESS_DENIED("COMMON_403", HttpStatus.FORBIDDEN, "error.common.access_denied"),
    RESOURCE_NOT_FOUND("COMMON_404", HttpStatus.NOT_FOUND, "error.common.resource_not_found"),
    METHOD_NOT_ALLOWED("COMMON_405", HttpStatus.METHOD_NOT_ALLOWED, "error.common.method_not_allowed"),
    /** A business operation asked of a resource in the wrong status (api-db README, API rule 3). */
    INVALID_STATE_TRANSITION("COMMON_409", HttpStatus.CONFLICT, "error.common.invalid_state_transition"),
    /** An endpoint whose business logic is not written yet (docs/services/vendor/completion-plan.md). */
    NOT_IMPLEMENTED("COMMON_501", HttpStatus.NOT_IMPLEMENTED, "error.common.not_implemented"),
    /** Another service did not answer, or answered with a server error. */
    DEPENDENCY_UNAVAILABLE("COMMON_503", HttpStatus.SERVICE_UNAVAILABLE, "error.common.dependency_unavailable"),

    // Answers of identity-service
    ACCOUNT_NOT_FOUND("ACCOUNT_001", HttpStatus.NOT_FOUND, "error.account.not_found"),

    // Vendor profile and review (FR-26, FR-27, FR-45)
    VENDOR_NOT_FOUND("VENDOR_001", HttpStatus.NOT_FOUND, "error.vendor.not_found"),
    /** One vendor per account (BR-11). */
    VENDOR_ALREADY_EXISTS("VENDOR_002", HttpStatus.CONFLICT, "error.vendor.already_exists"),
    /** BR-23, AC-26.5. */
    NFC_NOT_VERIFIED("VENDOR_003", HttpStatus.FORBIDDEN, "error.vendor.nfc_not_verified"),
    /** BR-27, AC-26.6: the declared ID number is not the submitting account's verified card. */
    REPRESENTATIVE_NOT_OWNER("VENDOR_004", HttpStatus.UNPROCESSABLE_ENTITY, "error.vendor.representative_not_owner"),
    /** BR-33: arg {0} the entity types that may register. */
    ENTITY_TYPE_NOT_ACCEPTED("VENDOR_005", HttpStatus.BAD_REQUEST, "error.vendor.entity_type_not_accepted"),
    /** AC-26.1: arg {0} the missing document kind. */
    DOCUMENT_REQUIRED("VENDOR_006", HttpStatus.BAD_REQUEST, "error.vendor.document_required"),
    /** A kind the caller may not attach, or an object key that is neither a new upload nor a current document. */
    DOCUMENT_NOT_ACCEPTED("VENDOR_007", HttpStatus.BAD_REQUEST, "error.vendor.document_not_accepted"),
    /** AC-26.2: Shop, accepting orders, or both. */
    SELLING_MODE_REQUIRED("VENDOR_008", HttpStatus.BAD_REQUEST, "error.vendor.selling_mode_required"),
    DOCUMENT_NOT_FOUND("VENDOR_009", HttpStatus.NOT_FOUND, "error.vendor.document_not_found"),
    /** AC-45.2. */
    REVIEW_REASON_REQUIRED("VENDOR_010", HttpStatus.BAD_REQUEST, "error.vendor.review_reason_required"),
    /** AC-45.5: arg {0} the confirmations still missing. */
    REVIEW_CONFIRMATION_REQUIRED("VENDOR_011", HttpStatus.BAD_REQUEST, "error.vendor.review_confirmation_required"),
    VENDOR_NOT_APPROVED("VENDOR_012", HttpStatus.CONFLICT, "error.vendor.not_approved"),
    REGISTRATION_FEE_ALREADY_PAID("VENDOR_013", HttpStatus.CONFLICT, "error.vendor.registration_fee_already_paid"),
    REGISTRATION_FEE_NOT_PAID("VENDOR_014", HttpStatus.CONFLICT, "error.vendor.registration_fee_not_paid"),
    VENDOR_NOT_ACCEPTING_ORDERS("VENDOR_015", HttpStatus.CONFLICT, "error.vendor.not_accepting_orders"),
    ORDER_PROFILE_NOT_FOUND("VENDOR_016", HttpStatus.NOT_FOUND, "error.vendor.order_profile_not_found"),
    ORDER_TERM_REQUIRED("VENDOR_017", HttpStatus.BAD_REQUEST, "error.vendor.order_term_required"),
    LOCK_REASON_REQUIRED("VENDOR_018", HttpStatus.BAD_REQUEST, "error.vendor.lock_reason_required"),

    // Value objects of a vendor profile
    TAX_CODE_INVALID("VENDOR_101", HttpStatus.BAD_REQUEST, "error.vendor.tax_code_invalid"),
    REPRESENTATIVE_NAME_INVALID("VENDOR_102", HttpStatus.BAD_REQUEST, "error.vendor.representative_name_invalid"),
    ID_NUMBER_INVALID("VENDOR_103", HttpStatus.BAD_REQUEST, "error.vendor.id_number_invalid"),
    BANK_ACCOUNT_NUMBER_INVALID("VENDOR_104", HttpStatus.BAD_REQUEST, "error.vendor.bank_account_number_invalid"),
    DELIVERY_FEE_INVALID("VENDOR_105", HttpStatus.BAD_REQUEST, "error.vendor.delivery_fee_invalid"),
    DELIVERY_AREAS_INVALID("VENDOR_106", HttpStatus.BAD_REQUEST, "error.vendor.delivery_areas_invalid");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;
}
