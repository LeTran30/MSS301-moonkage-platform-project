package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.vo.Price;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.ApplicationContext;

/** Vendors in a given state for the tests of other components, which cannot reach the vendor entity. */
public final class VendorFixture {

    private static final Price REGISTRATION_FEE = new Price(250_000);

    private final VendorRepository vendorRepository;

    public VendorFixture(ApplicationContext context) {
        this.vendorRepository = context.getBean(VendorRepository.class);
    }

    /** Approved and registration fee paid: it may operate (BR-20, BR-31). Without the Shop, it accepts orders. */
    public String saveOperating(String ownerId, SupplySource supplySource, boolean sellsShop) {
        Vendor vendor = approved(ownerId, supplySource, sellsShop);
        vendor.recordRegistrationFee(UUID.randomUUID().toString(), REGISTRATION_FEE, Instant.now());
        return vendorRepository.saveAndFlush(vendor).getId();
    }

    /** Approved, registration fee not paid yet: it may not operate. */
    public String saveUnpaid(String ownerId) {
        return vendorRepository
                .saveAndFlush(approved(ownerId, SupplySource.SELF_PRODUCED, true))
                .getId();
    }

    private static Vendor approved(String ownerId, SupplySource supplySource, boolean sellsShop) {
        // a vendor sells something: without the Shop it takes orders
        Vendor vendor = Vendor.register(ownerId, VendorTestData.profile(supplySource, sellsShop, !sellsShop));
        vendor.decide(ReviewDecision.APPROVE, null);
        return vendor;
    }
}
