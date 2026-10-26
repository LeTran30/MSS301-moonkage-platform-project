package com.moonkage.vendor.common.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class PriceConverter implements AttributeConverter<Price, Long> {

    @Override
    public Long convertToDatabaseColumn(Price attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public Price convertToEntityAttribute(Long dbData) {
        return dbData == null ? null : new Price(dbData);
    }
}
