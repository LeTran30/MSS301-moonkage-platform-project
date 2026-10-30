package com.moonkage.identity.address.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.shared.value.ValueRejected;
import com.moonkage.identity.shared.value.ValueRejected.Reason;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

class AddressValuesTest {

    @Test
    void provinceNameComesFromTheNationalList() {
        // decision C3: the code alone names the province
        assertEquals(new Province("79", "Thành phố Hồ Chí Minh"), Province.parse(" 79 "));
        assertEquals(Reason.UNKNOWN_CODE, reason(Province::parse, "99"));
        assertEquals(Reason.UNKNOWN_CODE, reason(Province::parse, "HCM"));
        assertEquals(Reason.REQUIRED, reason(Province::parse, " "));
    }

    @Test
    void locationReadsOnOneLineAndFiltersByProvince() {
        DeliveryLocation location = AddressFixtures.contact("12 Lê Lợi").location();

        assertEquals("12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh", location.oneLine());
        assertEquals(new DeliveryArea("79"), location.area());
    }

    @Test
    void textValuesAreTrimmedAndBounded() {
        assertEquals("Nguyễn Lan", RecipientName.parse("  Nguyễn Lan ").value());
        assertEquals(Reason.TOO_LONG, reason(RecipientName::parse, "n".repeat(RecipientName.MAX_LENGTH + 1)));
        assertEquals(Reason.TOO_LONG, reason(WardName::parse, "w".repeat(WardName.MAX_LENGTH + 1)));
        assertEquals(Reason.TOO_LONG, reason(StreetDetail::parse, "d".repeat(StreetDetail.MAX_LENGTH + 1)));
        assertEquals(Reason.TOO_LONG, reason(AddressLabel::parse, "l".repeat(AddressLabel.MAX_LENGTH + 1)));
        assertEquals(Reason.REQUIRED, reason(StreetDetail::parse, null));
    }

    @Test
    void addressIdThatIsNoUuidIsUnknown() {
        assertTrue(AddressId.tryParse("not-a-uuid").isEmpty());
        assertTrue(AddressId.tryParse(null).isEmpty());
        assertTrue(AddressId.tryParse(" 0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55 ").isPresent());
    }

    private static Reason reason(Function<String, ?> parse, String raw) {
        return assertThrows(ValueRejected.class, () -> parse.apply(raw)).reason();
    }
}
