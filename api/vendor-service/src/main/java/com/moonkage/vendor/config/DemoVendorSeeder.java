package com.moonkage.vendor.config;

import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.entity.BankAccount;
import com.moonkage.vendor.entity.Vendor;
import com.moonkage.vendor.enums.SupplySource;
import com.moonkage.vendor.enums.VendorEntityType;
import com.moonkage.vendor.enums.VendorStatus;
import com.moonkage.vendor.repository.VendorRepository;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Gives the demo seller account (seeded by identity-service) an approved Shop, idempotently.
 * identity may not be registered in Eureka yet when this service starts, so it retries in the background.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoVendorSeeder {

    private static final int MAX_ATTEMPTS = 24;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(5);

    private final IdentityClient identityClient;
    private final VendorRepository vendorRepository;

    @Value("${app.seller.email}")
    private String sellerEmail;

    @EventListener(ApplicationReadyEvent.class)
    public void seedInBackground() {
        Thread.ofVirtual().name("demo-vendor-seeder").start(this::seedWithRetry);
    }

    private void seedWithRetry() {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                seed();
                return;
            } catch (RuntimeException e) {
                log.info("Demo vendor not seeded yet (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
            }
            try {
                Thread.sleep(RETRY_DELAY);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        log.warn("Gave up seeding the demo vendor for {}", sellerEmail);
    }

    private void seed() {
        String ownerAccountId = identityClient.getAccountByEmail(sellerEmail).accountId();
        if (vendorRepository.findByOwnerAccountId(ownerAccountId).isPresent()) {
            return;
        }
        vendorRepository.save(demoShop(ownerAccountId));
        log.info("Seeded an approved Shop for {}", sellerEmail);
    }

    private static Vendor demoShop(String ownerAccountId) {
        BankAccount bank = new BankAccount();
        bank.setBankName("Vietcombank");
        bank.setAccountNumber("0071000123456");
        bank.setAccountHolder("CONG TY TNHH BANH TRUNG THU TRANG VANG");

        Vendor vendor = new Vendor();
        vendor.setOwnerAccountId(ownerAccountId);
        vendor.setLegalName("Công ty TNHH Bánh Trung Thu Trăng Vàng");
        vendor.setEntityType(VendorEntityType.ENTERPRISE);
        vendor.setTaxCode("0312345678");
        vendor.setAddress("123 Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh");
        vendor.setAreaCode("HCM");
        vendor.setBankAccount(bank);
        vendor.setSupplySource(SupplySource.BOTH);
        vendor.setSellsShop(true);
        vendor.setAcceptsOrders(true);
        vendor.setStatus(VendorStatus.APPROVED);
        return vendor;
    }
}
