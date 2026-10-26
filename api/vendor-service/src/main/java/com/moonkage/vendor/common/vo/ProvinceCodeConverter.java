package com.moonkage.vendor.common.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class ProvinceCodeConverter implements AttributeConverter<ProvinceCode, String> {

    @Override
    public String convertToDatabaseColumn(ProvinceCode attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public ProvinceCode convertToEntityAttribute(String dbData) {
        return dbData == null || dbData.isBlank() ? null : new ProvinceCode(dbData);
    }
}
