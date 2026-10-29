package com.moonkage.identity.profile.infrastructure.persistence;

import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.LegalName;
import com.moonkage.identity.profile.MaskedIdNumber;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Column ↔ value object for the profile's fields. Stored values are trusted data: read through the constructor. */
final class ProfileValueConverters {

    private ProfileValueConverters() {}

    @Converter(autoApply = true)
    static class FullNameConverter implements AttributeConverter<FullName, String> {

        @Override
        public String convertToDatabaseColumn(FullName attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public FullName convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new FullName(dbData);
        }
    }

    @Converter(autoApply = true)
    static class LegalNameConverter implements AttributeConverter<LegalName, String> {

        @Override
        public String convertToDatabaseColumn(LegalName attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public LegalName convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new LegalName(dbData);
        }
    }

    @Converter(autoApply = true)
    static class IdNumberHashConverter implements AttributeConverter<IdNumberHash, String> {

        @Override
        public String convertToDatabaseColumn(IdNumberHash attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public IdNumberHash convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new IdNumberHash(dbData);
        }
    }

    @Converter(autoApply = true)
    static class MaskedIdNumberConverter implements AttributeConverter<MaskedIdNumber, String> {

        @Override
        public String convertToDatabaseColumn(MaskedIdNumber attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public MaskedIdNumber convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new MaskedIdNumber(dbData);
        }
    }
}
