package com.moonkage.order.exception;

import com.moonkage.api.CommonErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INTERNAL_SERVER_ERROR(CommonErrorCode.INTERNAL_SERVER_ERROR),
    INVALID_INPUT(CommonErrorCode.INVALID_INPUT),
    MALFORMED_JSON(CommonErrorCode.MALFORMED_JSON),
    /** A required query parameter is missing, e.g. {@code provinceCode} on GET /api/carts/me. */
    PARAMETER_REQUIRED(CommonErrorCode.PARAMETER_REQUIRED),
    /** No X-Account-Id / X-User-Role: the call did not come through the gateway with a token. */
    UNAUTHENTICATED(CommonErrorCode.UNAUTHENTICATED),
    ACCESS_DENIED(CommonErrorCode.ACCESS_DENIED),
    RESOURCE_NOT_FOUND(CommonErrorCode.RESOURCE_NOT_FOUND),
    METHOD_NOT_ALLOWED(CommonErrorCode.METHOD_NOT_ALLOWED),
    /** A business operation asked of a resource in the wrong status (api-db README, API rule 3). */
    INVALID_STATE_TRANSITION(CommonErrorCode.INVALID_STATE_TRANSITION),
    /** Another service did not answer, or answered with a server error. */
    DEPENDENCY_UNAVAILABLE(CommonErrorCode.DEPENDENCY_UNAVAILABLE),

    // Cart (FR-08)
    CART_ITEM_NOT_FOUND("CART_001", HttpStatus.NOT_FOUND, "error.cart.item_not_found"),
    /** Not on sale, Shop off or vendor not allowed to sell (BR-20, BR-21). */
    PRODUCT_NOT_AVAILABLE("CART_002", HttpStatus.CONFLICT, "error.cart.product_not_available"),
    /** BR-22: the caller owns the vendor. */
    OWN_PRODUCT("CART_003", HttpStatus.FORBIDDEN, "error.cart.own_product"),
    /** AC-08.2: arg {0} the stock on sale. */
    QUANTITY_OVER_STOCK("CART_004", HttpStatus.CONFLICT, "error.cart.quantity_over_stock"),
    /** AC-08.2, BR-03: arg {0} the vendor's quote threshold; the buyer sends a request instead. */
    QUANTITY_NEEDS_QUOTE("CART_005", HttpStatus.CONFLICT, "error.cart.quantity_needs_quote"),

    // Checkout (FR-09, BR-28, BR-29, BR-30)
    CART_EMPTY("CHECKOUT_001", HttpStatus.CONFLICT, "error.checkout.cart_empty"),
    /** BR-30: arg {0} the vendor that does not deliver to the province. */
    NOT_DELIVERABLE("CHECKOUT_002", HttpStatus.CONFLICT, "error.checkout.not_deliverable"),
    /** BR-28: vendor-service could not hold every piece. */
    STOCK_UNAVAILABLE("CHECKOUT_003", HttpStatus.CONFLICT, "error.checkout.stock_unavailable"),
    CHECKOUT_NOT_FOUND("CHECKOUT_004", HttpStatus.NOT_FOUND, "error.checkout.not_found"),

    // Orders (FR-10, FR-21, FR-22, FR-32, FR-40)
    /** Also answered for an order the caller may not see, so its existence does not leak. */
    ORDER_NOT_FOUND("ORDER_001", HttpStatus.NOT_FOUND, "error.order.not_found"),
    /** AC-32.3: an interprovince buy-now order ships only with a tracking code. */
    TRACKING_CODE_REQUIRED("ORDER_002", HttpStatus.BAD_REQUEST, "error.order.tracking_code_required"),
    /** BR-15: production starts only after the buyer approved a mockup version. */
    MOCKUP_NOT_APPROVED("ORDER_003", HttpStatus.CONFLICT, "error.order.mockup_not_approved"),
    MOCKUP_NOT_FOUND("ORDER_004", HttpStatus.NOT_FOUND, "error.order.mockup_not_found"),
    /** Mockups belong to custom orders with custom work only (BR-14). */
    NO_CUSTOM_WORK("ORDER_005", HttpStatus.CONFLICT, "error.order.no_custom_work"),
    /** FR-20: asking for changes says which. */
    REVIEW_NOTE_REQUIRED("ORDER_006", HttpStatus.BAD_REQUEST, "error.order.review_note_required"),
    /** AC-25.1: the vendor has not attached its invoice yet. */
    INVOICE_NOT_ATTACHED("ORDER_007", HttpStatus.NOT_FOUND, "error.order.invoice_not_attached"),
    /** An upload that is missing, of another type, too large or not the declared format (common-storage). */
    FILE_INVALID("ORDER_008", HttpStatus.BAD_REQUEST, "error.order.file_invalid"),
    /** GET /api/orders/stats: {@code from} after {@code to}, or longer than order.stats-max-days. */
    STATS_RANGE_INVALID("ORDER_009", HttpStatus.BAD_REQUEST, "error.order.stats_range_invalid"),

    // Disputes (FR-12, FR-49, BR-18, P-02)
    DISPUTE_NOT_FOUND("DISPUTE_001", HttpStatus.NOT_FOUND, "error.dispute.not_found"),
    /** AC-12.2: not delivered yet, or past the complaint deadline. */
    COMPLAINT_WINDOW_CLOSED("DISPUTE_002", HttpStatus.CONFLICT, "error.dispute.complaint_window_closed"),
    DISPUTE_ALREADY_OPEN("DISPUTE_003", HttpStatus.CONFLICT, "error.dispute.already_open"),
    /** P-02: payment-service already locked the order to pay the vendor. */
    PAYOUT_LOCKED("DISPUTE_004", HttpStatus.CONFLICT, "error.dispute.payout_locked"),
    /** A partial refund is more than 0 and less than the order total. */
    REFUND_AMOUNT_INVALID("DISPUTE_005", HttpStatus.BAD_REQUEST, "error.dispute.refund_amount_invalid"),
    /** P-02: not received nor past the complaint deadline, or a dispute is open. */
    PAYOUT_NOT_ELIGIBLE("DISPUTE_006", HttpStatus.CONFLICT, "error.dispute.payout_not_eligible"),

    // Reviews (FR-11, BR-32)
    /** Only a product of a delivered buy-now order of the caller. */
    REVIEW_NOT_ALLOWED("REVIEW_001", HttpStatus.CONFLICT, "error.review.not_allowed"),
    REVIEW_ALREADY_EXISTS("REVIEW_002", HttpStatus.CONFLICT, "error.review.already_exists"),

    // Chat between a buyer and a Shop
    /** Not one of its two sides, or no such conversation: the same answer, so nothing leaks. */
    CONVERSATION_NOT_FOUND("CHAT_001", HttpStatus.NOT_FOUND, "error.chat.conversation_not_found"),
    /** BR-22 in spirit: an owner does not chat with their own Shop. */
    CHAT_WITH_OWN_SHOP("CHAT_002", HttpStatus.CONFLICT, "error.chat.own_shop"),
    SHOP_NOT_FOUND("CHAT_003", HttpStatus.NOT_FOUND, "error.chat.shop_not_found");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;

    /**
     * A common code, taken from the shared list of common-api.
     *
     * <p>The code string, the status and the message key of the common failures exist in one place now, so they can no
     * longer drift apart between the services (audit findings H-02 and H-03).
     */
    ErrorCode(CommonErrorCode common) {
        this.code = common.getCode();
        this.httpStatus = common.getHttpStatus();
        this.messageKey = common.getMessageKey();
    }
}
