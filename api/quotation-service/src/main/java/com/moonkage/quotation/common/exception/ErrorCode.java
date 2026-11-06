package com.moonkage.quotation.common.exception;

import com.moonkage.api.CommonErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * The error codes of quotation-service.
 *
 * <p>The common ones ({@code COMMON_*}) take their code string and their status from {@link CommonErrorCode}, the
 * list every service shares, so the same failure cannot be named two ways in two services. The text stays in this
 * enum: quotation keeps no message bundle of its own, so the wording lives next to the code it belongs to and is
 * shown to the user as it is.
 *
 * <p>The business codes ({@code QUOTE_*}) are quotation's own and keep their own string, status and text.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common: the code string and the status come from the shared list, the text stays quotation's own
    INTERNAL_SERVER_ERROR(CommonErrorCode.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn."),
    INVALID_INPUT(CommonErrorCode.INVALID_INPUT, "Dữ liệu gửi lên không hợp lệ."),
    MALFORMED_JSON(CommonErrorCode.MALFORMED_JSON, "Nội dung gửi lên không đọc được."),
    UNAUTHENTICATED(CommonErrorCode.UNAUTHENTICATED, "Thiếu thông tin đăng nhập."),
    ACCESS_DENIED(CommonErrorCode.ACCESS_DENIED, "Bạn không có quyền thực hiện thao tác này."),
    RESOURCE_NOT_FOUND(CommonErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đường dẫn."),
    METHOD_NOT_ALLOWED(CommonErrorCode.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ."),
    INVALID_STATE_TRANSITION(CommonErrorCode.INVALID_STATE_TRANSITION, "Không thể chuyển sang trạng thái {0}."),
    DEPENDENCY_UNAVAILABLE(
            CommonErrorCode.DEPENDENCY_UNAVAILABLE, "Dịch vụ liên quan đang không phản hồi. Vui lòng thử lại."),

    // Buyer and vendor checks (BR-16, BR-20, BR-22, BR-23, BR-31)
    NFC_NOT_VERIFIED("QUOTE_001", HttpStatus.FORBIDDEN, "Tài khoản cần xác minh NFC trước khi gửi yêu cầu (BR-23)."),
    SELF_DEALING("QUOTE_002", HttpStatus.FORBIDDEN, "Không thể giao dịch với người bán do chính bạn làm chủ (BR-22)."),
    VENDOR_NOT_FOUND("QUOTE_003", HttpStatus.NOT_FOUND, "Không tìm thấy người bán."),
    VENDOR_NOT_ACCEPTING_ORDERS(
            "QUOTE_004", HttpStatus.CONFLICT, "Người bán hiện không nhận yêu cầu đặt hàng (BR-20, BR-31)."),
    BELOW_MIN_QUANTITY("QUOTE_005", HttpStatus.BAD_REQUEST, "Số lượng tối thiểu của người bán là {0} (BR-16)."),
    CUSTOM_NOT_SUPPORTED("QUOTE_006", HttpStatus.BAD_REQUEST, "Người bán không làm được loại custom {0} (BR-14)."),
    NO_MATCHING_VENDOR(
            "QUOTE_007",
            HttpStatus.BAD_REQUEST,
            "Chưa có người bán phù hợp. Hãy thử đổi số lượng, loại custom hoặc hạn giao (FR-16)."),
    INVALID_PROVINCE("QUOTE_008", HttpStatus.BAD_REQUEST, "Mã tỉnh {0} không hợp lệ."),
    DELIVERY_DEADLINE_PASSED("QUOTE_009", HttpStatus.BAD_REQUEST, "Hạn giao phải sau hôm nay."),
    TARGET_VENDOR_REQUIRED("QUOTE_010", HttpStatus.BAD_REQUEST, "Yêu cầu trực tiếp phải có người bán đích (FR-15)."),

    // Requests and invitations
    REQUEST_NOT_FOUND("QUOTE_020", HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu."),
    REQUEST_NOT_OPEN("QUOTE_021", HttpStatus.CONFLICT, "Yêu cầu không còn mở."),
    INVITATION_NOT_FOUND("QUOTE_022", HttpStatus.NOT_FOUND, "Người bán không được mời vào yêu cầu này."),
    DECLINE_REASON_REQUIRED("QUOTE_023", HttpStatus.BAD_REQUEST, "Từ chối phải kèm lý do (AC-36.3)."),
    INVITATION_DECLINED("QUOTE_024", HttpStatus.CONFLICT, "Người bán đã từ chối yêu cầu này."),

    // Quotes (FR-38, BR-05)
    QUOTE_NOT_FOUND("QUOTE_030", HttpStatus.NOT_FOUND, "Không tìm thấy báo giá."),
    QUOTE_ALREADY_SUBMITTED(
            "QUOTE_031", HttpStatus.CONFLICT, "Đã có báo giá đang hiệu lực; hãy gửi bản mới thay cho bản đó (BR-05)."),
    QUOTE_LOCKED("QUOTE_032", HttpStatus.CONFLICT, "Báo giá đang chờ người mua thanh toán cọc, không thu hồi được."),
    QUOTE_NOT_ACCEPTABLE("QUOTE_033", HttpStatus.CONFLICT, "Báo giá đã hết hiệu lực hoặc đã thu hồi (BR-05)."),
    INVALID_QUOTE_LINES("QUOTE_034", HttpStatus.BAD_REQUEST, "Dòng báo giá không hợp lệ: {0}."),
    INVALID_DEPOSIT(
            "QUOTE_035", HttpStatus.BAD_REQUEST, "Tỷ lệ cọc phải lớn hơn 0, không quá 100 và tiền cọc lớn hơn 0."),
    INVALID_VALIDITY("QUOTE_036", HttpStatus.BAD_REQUEST, "Thời hạn hiệu lực từ {0} đến {1} ngày (Q-19)."),
    INVALID_SUPERSEDED_QUOTE(
            "QUOTE_037", HttpStatus.CONFLICT, "Bản thay thế phải trỏ tới báo giá mới nhất của chính người bán."),
    DELIVERY_DATE_PASSED("QUOTE_038", HttpStatus.BAD_REQUEST, "Ngày giao phải từ hôm nay trở đi."),

    // Acceptance and deposit (FR-19, BR-04, BR-17)
    REQUEST_ALREADY_AWARDED("QUOTE_040", HttpStatus.CONFLICT, "Yêu cầu đã chốt với một báo giá khác (BR-17)."),
    ACCEPTANCE_IN_PROGRESS("QUOTE_041", HttpStatus.CONFLICT, "Báo giá này đang chờ thanh toán cọc."),
    ACCEPTANCE_NOT_FOUND("QUOTE_042", HttpStatus.NOT_FOUND, "Báo giá chưa được chấp nhận."),
    INVALID_INVOICE_INFO(
            "QUOTE_043", HttpStatus.BAD_REQUEST, "Thông tin hóa đơn phải đủ tên, mã số thuế, địa chỉ, email (FR-24)."),
    VENDOR_TAX_CODE_MISSING(
            "QUOTE_044", HttpStatus.CONFLICT, "Hồ sơ người bán chưa đồng bộ mã số thuế; chưa chấp nhận được.");

    private final String code;
    private final HttpStatus httpStatus;
    private final String message;

    /**
     * A common code, taken from the shared list of common-api, with the text quotation shows to the user.
     *
     * <p>The code string and the status come from {@link CommonErrorCode}, so they are the same in every service;
     * the text stays here, because quotation keeps no message bundle and its {@code ErrorCode} holds the wording
     * next to the code it belongs to.
     */
    ErrorCode(CommonErrorCode common, String message) {
        this.code = common.getCode();
        this.httpStatus = common.getHttpStatus();
        this.message = message;
    }
}
