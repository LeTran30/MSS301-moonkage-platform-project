package com.moonkage.identity.account.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class PasswordHashConverter implements AttributeConverter<PasswordHash, String> {

    @Override
    public String convertToDatabaseColumn(PasswordHash attribute) {
        return attribute == null ? null : attribute.hash();
    }

    @Override
    public PasswordHash convertToEntityAttribute(String dbData) {
        return dbData == null || dbData.isBlank() ? null : new PasswordHash(dbData);
    }
}
