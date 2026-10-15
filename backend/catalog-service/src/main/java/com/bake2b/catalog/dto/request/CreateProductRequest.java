package com.bake2b.catalog.dto.request;

import com.bake2b.catalog.enums.DeliveryLabel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/** AC-30.1: name, images, description, VAT-inclusive price, stock and expiry date are required. */
@Data
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Mô tả không được để trống")
    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    @NotEmpty(message = "Cần ít nhất 1 ảnh")
    @Size(max = 10, message = "Tối đa 10 ảnh")
    private List<@NotBlank(message = "URL ảnh không được để trống") String> imageUrls;

    @Size(max = 100, message = "Loại bánh tối đa 100 ký tự")
    private String cakeType;

    /** Required when the vendor resells (AC-30.2). */
    @Size(max = 100, message = "Thương hiệu tối đa 100 ký tự")
    private String brand;

    /** Place of manufacture; required when the vendor resells (AC-30.2). */
    @Size(max = 255, message = "Nơi sản xuất tối đa 255 ký tự")
    private String origin;

    @Positive(message = "Số bánh mỗi hộp phải lớn hơn 0")
    private Integer piecesPerBox;

    @NotNull(message = "Giá niêm yết không được để trống")
    @Positive(message = "Giá niêm yết phải lớn hơn 0")
    private Long listPrice;

    @NotNull(message = "Tồn kho không được để trống")
    @PositiveOrZero(message = "Tồn kho không được âm")
    private Integer stock;

    @NotNull(message = "Hạn dùng không được để trống")
    @FutureOrPresent(message = "Hạn dùng không được ở quá khứ")
    private LocalDate expiryDate;

    @NotNull(message = "Nhãn giao hàng không được để trống")
    private DeliveryLabel deliveryLabel;

    /** Qty at/above which the buyer must send a request instead (FR-32). Only effective if the vendor accepts orders. */
    @Min(value = 2, message = "Ngưỡng báo giá phải từ 2 trở lên")
    private Integer quoteThreshold;

    @Valid
    private List<PriceTierRequest> priceTiers;
}
