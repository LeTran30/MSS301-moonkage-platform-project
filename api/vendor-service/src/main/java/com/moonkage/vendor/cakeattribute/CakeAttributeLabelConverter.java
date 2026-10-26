package com.moonkage.vendor.cakeattribute;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class CakeAttributeLabelConverter implements AttributeConverter<CakeAttributeLabel, String> {

    @Override
    public String convertToDatabaseColumn(CakeAttributeLabel attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public CakeAttributeLabel convertToEntityAttribute(String dbData) {
        return dbData == null ? null : new CakeAttributeLabel(dbData);
    }
}
