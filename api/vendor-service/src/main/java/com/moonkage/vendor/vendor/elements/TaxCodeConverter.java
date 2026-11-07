package com.moonkage.vendor.vendor.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class TaxCodeConverter implements AttributeConverter<TaxCode, String> {

    @Override
    public String convertToDatabaseColumn(TaxCode attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public TaxCode convertToEntityAttribute(String dbData) {
        return dbData == null || dbData.isBlank() ? null : new TaxCode(dbData);
    }
}
