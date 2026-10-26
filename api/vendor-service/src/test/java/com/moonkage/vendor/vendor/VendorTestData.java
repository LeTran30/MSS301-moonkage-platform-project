package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;

/** Valid data shared by the tests of the vendor component. */
final class VendorTestData {

    private VendorTestData() {}

    /** A self-producing shop that does not accept orders. */
    static VendorProfile profile() {
        return profile(SupplySource.SELF_PRODUCED, true, false);
    }

    static VendorProfile profile(SupplySource supplySource, boolean sellsShop, boolean acceptsOrders) {
        return new VendorProfile(
                "Tiệm bánh Trăng",
                VendorEntityType.SOLE_PROPRIETORSHIP,
                TaxCode.of("0312345678"),
                "12 Lê Lợi",
                ProvinceCode.of("79"),
                RepresentativeName.of("NGUYEN VAN A"),
                new HashedIdNumber("a".repeat(64), 1, "********1234"),
                supplySource,
                sellsShop,
                acceptsOrders,
                BankAccount.of(
                        "Vietcombank",
                        "NGUYEN VAN A",
                        new EncryptedBankAccountNumber(new byte[] {1}, 1, "******6789")));
    }
}
