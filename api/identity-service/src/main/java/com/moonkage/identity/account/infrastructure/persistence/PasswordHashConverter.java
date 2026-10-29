package com.moonkage.identity.account.infrastructure.persistence;

import com.moonkage.identity.account.domain.PasswordHash;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** The stored hash is trusted data: read through the constructor. */
@Converter(autoApply = true)
class PasswordHashConverter implements AttributeConverter<PasswordHash, String> {

    @Override
    public String convertToDatabaseColumn(PasswordHash attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public PasswordHash convertToEntityAttribute(String dbData) {
        return dbData == null ? null : new PasswordHash(dbData);
    }
}
