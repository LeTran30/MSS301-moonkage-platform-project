package com.moonkage.vendor.vendor.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class DeliveryFeeConverter implements AttributeConverter<DeliveryFee, Long> {

    @Override
    public Long convertToDatabaseColumn(DeliveryFee attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public DeliveryFee convertToEntityAttribute(Long dbData) {
        return dbData == null ? null : new DeliveryFee(dbData);
    }
}
