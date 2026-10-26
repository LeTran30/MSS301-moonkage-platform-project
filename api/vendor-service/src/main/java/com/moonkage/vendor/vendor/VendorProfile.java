package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;

/**
 * What the owner declares in one submission (AC-26.1, AC-26.2), already checked: every rule-bearing field is a value
 * object, and the ID number and bank account number are in their stored forms.
 */
record VendorProfile(
        String businessName,
        VendorEntityType entityType,
        TaxCode taxCode,
        String address,
        ProvinceCode provinceCode,
        RepresentativeName representativeName,
        HashedIdNumber representativeIdNumber,
        SupplySource supplySource,
        boolean sellsShop,
        boolean acceptsOrders,
        BankAccount bankAccount) {}
