package com.moonkage.identity.address.infrastructure.persistence;

import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.address.domain.RecipientName;
import com.moonkage.identity.address.domain.StreetDetail;
import com.moonkage.identity.address.domain.WardName;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** One-column value objects of an address, stored as their text. */
final class AddressValueConverters {

    private AddressValueConverters() {}

    @Converter(autoApply = true)
    static class RecipientNameConverter implements AttributeConverter<RecipientName, String> {

        @Override
        public String convertToDatabaseColumn(RecipientName attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public RecipientName convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new RecipientName(dbData);
        }
    }

    @Converter(autoApply = true)
    static class WardNameConverter implements AttributeConverter<WardName, String> {

        @Override
        public String convertToDatabaseColumn(WardName attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public WardName convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new WardName(dbData);
        }
    }

    @Converter(autoApply = true)
    static class StreetDetailConverter implements AttributeConverter<StreetDetail, String> {

        @Override
        public String convertToDatabaseColumn(StreetDetail attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public StreetDetail convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new StreetDetail(dbData);
        }
    }

    @Converter(autoApply = true)
    static class AddressLabelConverter implements AttributeConverter<AddressLabel, String> {

        @Override
        public String convertToDatabaseColumn(AddressLabel attribute) {
            return attribute == null ? null : attribute.value();
        }

        @Override
        public AddressLabel convertToEntityAttribute(String dbData) {
            return dbData == null ? null : new AddressLabel(dbData);
        }
    }
}
