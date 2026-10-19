package com.moonkage.catalog.dto.request;

import com.moonkage.catalog.enums.DeliveryLabel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/**
 * Partial update: a field that is missing, null, blank text or an empty imageKeys list keeps its old value.
 * imageKeys, when sent, is the full new list in display order (images left out are deleted).
 * priceTiers is the exception: when sent it replaces all tiers, and [] removes them.
 */
@Data
public class UpdateProductRequest {

    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    /** tempKey from POST /api/seller/products/images/uploads, or a key the product already has. */
    @Size(max = 10, message = "Tối đa 10 ảnh")
    private List<@NotBlank(message = "Mã ảnh không được để trống") String> imageKeys;

    @Size(max = 100, message = "Loại bánh tối đa 100 ký tự")
    private String cakeType;

    @Size(max = 100, message = "Thương hiệu tối đa 100 ký tự")
    private String brand;

    @Size(max = 255, message = "Nơi sản xuất tối đa 255 ký tự")
    private String origin;

    @Positive(message = "Số bánh mỗi hộp phải lớn hơn 0")
    private Integer piecesPerBox;

    @Positive(message = "Giá niêm yết phải lớn hơn 0")
    private Long listPrice;

    @PositiveOrZero(message = "Tồn kho không được âm")
    private Integer stock;

    @FutureOrPresent(message = "Hạn dùng không được ở quá khứ")
    private LocalDate expiryDate;

    private DeliveryLabel deliveryLabel;

    @Min(value = 2, message = "Ngưỡng báo giá phải từ 2 trở lên")
    private Integer quoteThreshold;

    @Valid
    private List<PriceTierRequest> priceTiers;
}
