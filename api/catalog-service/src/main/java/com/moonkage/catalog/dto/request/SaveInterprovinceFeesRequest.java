package com.moonkage.catalog.dto.request;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.moonkage.catalog.json.VndDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;

public record SaveInterprovinceFeesRequest(@NotEmpty List<@NotNull @Valid Fee> fees) {
    public record Fee(
            @NotBlank @Pattern(regexp = "[0-9]{2}") String provinceCode,

            @NotNull @PositiveOrZero @JsonDeserialize(using = VndDeserializer.class)
            Long fee) {}
}
