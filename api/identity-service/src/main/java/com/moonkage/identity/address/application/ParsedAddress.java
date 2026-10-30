package com.moonkage.identity.address.application;

import com.moonkage.identity.address.AddressDraft;
import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.address.domain.DeliveryContact;
import com.moonkage.identity.address.domain.DeliveryLocation;
import com.moonkage.identity.address.domain.Province;
import com.moonkage.identity.address.domain.Recipient;
import com.moonkage.identity.address.domain.RecipientName;
import com.moonkage.identity.address.domain.StreetDetail;
import com.moonkage.identity.address.domain.WardName;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.PhoneNumber;

/**
 * A draft once every field is parsed.
 *
 * @param label null when not given
 * @param isDefault as sent
 */
record ParsedAddress(DeliveryContact contact, AddressLabel label, Boolean isDefault) {

    /** Every field parsed, or a 400 listing every bad one. A blank label means none. */
    static ParsedAddress of(AddressDraft draft) {
        FieldParser parser = new FieldParser();
        var name = parser.required(
                "recipientName", "validation.address.recipient_name", draft.recipientName(), RecipientName::parse);
        var phone = parser.required(
                "recipientPhone", "validation.address.recipient_phone", draft.recipientPhone(), PhoneNumber::parse);
        var province = parser.required(
                "provinceCode", "validation.address.province_code", draft.provinceCode(), Province::parse);
        var ward = parser.required("wardName", "validation.address.ward_name", draft.wardName(), WardName::parse);
        var detail = parser.required("detail", "validation.address.detail", draft.detail(), StreetDetail::parse);
        var label = parser.optional("label", "validation.address.label", draft.label(), AddressLabel::parse);
        parser.throwIfRejected();
        return new ParsedAddress(
                new DeliveryContact(new Recipient(name, phone), new DeliveryLocation(province, ward, detail)),
                label,
                draft.isDefault());
    }
}
