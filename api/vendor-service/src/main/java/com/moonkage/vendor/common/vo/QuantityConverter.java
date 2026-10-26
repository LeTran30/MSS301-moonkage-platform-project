package com.moonkage.vendor.common.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class QuantityConverter implements AttributeConverter<Quantity, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Quantity attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public Quantity convertToEntityAttribute(Integer dbData) {
        return dbData == null ? null : new Quantity(dbData);
    }
}
