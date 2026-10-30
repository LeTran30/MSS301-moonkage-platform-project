package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.PhoneNumber;

/** Valid address values for tests in other packages. */
public final class AddressFixtures {

    private AddressFixtures() {}

    /** A delivery to Lan in Thành phố Hồ Chí Minh; {@code detail} tells addresses apart. */
    public static DeliveryContact contact(String detail) {
        return new DeliveryContact(
                new Recipient(RecipientName.parse("Nguyễn Lan"), PhoneNumber.parse("0912345678")),
                new DeliveryLocation(
                        Province.parse("79"), WardName.parse("Phường Sài Gòn"), StreetDetail.parse(detail)));
    }
}
