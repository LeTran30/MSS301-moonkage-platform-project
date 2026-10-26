package com.moonkage.vendor.vendor;

/** Limits of the vendor tables that requests must respect. */
public final class VendorConstant {

    /** varchar(255) columns of vendors: business_name, address, bank_name, bank_account_holder. */
    public static final int TEXT_MAX_LENGTH = 255;

    private VendorConstant() {}
}
