package com.bake2b.catalog.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class PriceTierRequest {

    @NotNull(message = "Số lượng từ không được để trống")
    @Min(value = 2, message = "Bậc giá bắt đầu từ 2 hộp trở lên")
    private Integer fromQty;

    @NotNull(message = "Đơn giá không được để trống")
    @Positive(message = "Đơn giá phải lớn hơn 0")
    private Long unitPrice;
}
