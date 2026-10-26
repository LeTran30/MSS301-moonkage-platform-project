package com.moonkage.vendor.vendor.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class RepresentativeNameConverter implements AttributeConverter<RepresentativeName, String> {

    @Override
    public String convertToDatabaseColumn(RepresentativeName attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public RepresentativeName convertToEntityAttribute(String dbData) {
        return dbData == null || dbData.isBlank() ? null : new RepresentativeName(dbData);
    }
}
