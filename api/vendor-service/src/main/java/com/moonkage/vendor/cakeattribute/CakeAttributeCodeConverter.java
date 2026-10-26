package com.moonkage.vendor.cakeattribute;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class CakeAttributeCodeConverter implements AttributeConverter<CakeAttributeCode, String> {

    @Override
    public String convertToDatabaseColumn(CakeAttributeCode attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public CakeAttributeCode convertToEntityAttribute(String dbData) {
        return dbData == null ? null : new CakeAttributeCode(dbData);
    }
}
