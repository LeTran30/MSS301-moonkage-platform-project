package com.moonkage.catalog.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CatalogErrorCode {
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "CAT_001", "Dữ liệu gửi lên không hợp lệ"),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "CAT_002", "Bạn cần đăng nhập"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "CAT_003", "Chỉ quản trị viên được cập nhật bảng phí"),
    INCOMPLETE_FEE_TABLE(HttpStatus.BAD_REQUEST, "CAT_004", "Bảng phí phải có đúng một dòng cho mỗi tỉnh"),
    PROVINCE_NOT_FOUND(HttpStatus.NOT_FOUND, "CAT_005", "Mã tỉnh không tồn tại"),
    FEE_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "CAT_006", "Phí giao tỉnh này chưa được cấu hình"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CAT_008", "Đã xảy ra lỗi, vui lòng thử lại");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
