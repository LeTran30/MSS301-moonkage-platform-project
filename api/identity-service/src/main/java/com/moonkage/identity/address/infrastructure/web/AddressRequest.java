package com.moonkage.identity.address.infrastructure.web;

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
 * FR-03: a delivery address to create, or to replace an existing one with. The client picks the province from the
 * national list and gives the ward as display text (L-15).
 *
 * @param recipientPhone Vietnamese mobile number in the national form 0912345678 (decision C1)
 * @param provinceCode 2-digit national code, e.g. 79 for Thành phố Hồ Chí Minh
 * @param provinceName ignored: the server names the province from {@code provinceCode} (decision C3). Still
 *     accepted so older clients keep working
 * @param detail house number and street
 * @param isDefault true makes this the default. On update false clears it and null keeps the current flag
 */
public record AddressRequest(
        String recipientName,
        String recipientPhone,
        String provinceCode,
        String provinceName,
        String wardName,
        String detail,
        String label,
        Boolean isDefault) {

    /** Every field parsed, or a 400 listing every bad one. A blank label means none. */
    SubmittedAddress parse() {
        FieldParser parser = new FieldParser();
        var parsedName = parser.required(
                "recipientName", "validation.address.recipient_name", recipientName, RecipientName::parse);
        var parsedPhone = parser.required(
                "recipientPhone", "validation.address.recipient_phone", recipientPhone, PhoneNumber::parse);
        var parsedProvince =
                parser.required("provinceCode", "validation.address.province_code", provinceCode, Province::parse);
        var parsedWard = parser.required("wardName", "validation.address.ward_name", wardName, WardName::parse);
        var parsedDetail = parser.required("detail", "validation.address.detail", detail, StreetDetail::parse);
        var parsedLabel = parser.optional("label", "validation.address.label", label, AddressLabel::parse);
        parser.throwIfRejected();
        return new SubmittedAddress(
                new DeliveryContact(
                        new Recipient(parsedName, parsedPhone),
                        new DeliveryLocation(parsedProvince, parsedWard, parsedDetail)),
                parsedLabel,
                isDefault);
    }

    /** The request once parsed. {@code label} is null when not given; {@code isDefault} as sent. */
    record SubmittedAddress(DeliveryContact contact, AddressLabel label, Boolean isDefault) {}
}
