package com.moonkage.identity.config;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.BankAccount;
import com.moonkage.identity.entity.Role;
import com.moonkage.identity.entity.User;
import com.moonkage.identity.entity.Vendor;
import com.moonkage.identity.enums.AccountStatus;
import com.moonkage.identity.enums.SupplySource;
import com.moonkage.identity.enums.VendorEntityType;
import com.moonkage.identity.enums.VendorStatus;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.RoleRepository;
import com.moonkage.identity.repository.UserRepository;
import com.moonkage.identity.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds roles, one platform admin and one approved seller with a Shop on startup (idempotent). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.seller.email}")
    private String sellerEmail;

    @Value("${app.seller.password}")
    private String sellerPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initializeRole("CUSTOMER", "Người mua");
        Role sellerRole = initializeRole("SELLER", "Người bán có vendor đã được duyệt");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên MoonKage");

        if (accountRepository.findByEmail(adminEmail).isEmpty()) {
            Account admin = accountRepository.save(activeAccount(adminEmail, adminPassword, adminRole));
            userRepository.save(User.builder()
                    .fullName("Quản trị viên MoonKage")
                    .email(adminEmail)
                    .account(admin)
                    .build());
            log.info("Seeded admin account {}", adminEmail);
        }

        if (accountRepository.findByEmail(sellerEmail).isEmpty()) {
            Account account = accountRepository.save(activeAccount(sellerEmail, sellerPassword, sellerRole));
            User owner = userRepository.save(User.builder()
                    .fullName("Nguyễn Văn Bánh")
                    .email(sellerEmail)
                    .phoneNumber("0901234567")
                    .account(account)
                    .build());
            vendorRepository.save(demoShop(owner));
            log.info("Seeded seller account {} with an approved Shop", sellerEmail);
        }
    }

    private Account activeAccount(String email, String rawPassword, Role role) {
        return Account.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(AccountStatus.ACTIVE)
                .accountVerified(true)
                .role(role)
                .build();
    }

    private static Vendor demoShop(User owner) {
        BankAccount bank = new BankAccount();
        bank.setBankName("Vietcombank");
        bank.setAccountNumber("0071000123456");
        bank.setAccountHolder("CONG TY TNHH BANH TRUNG THU TRANG VANG");

        Vendor vendor = new Vendor();
        vendor.setOwner(owner);
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

    private Role initializeRole(String name, String description) {
        return roleRepository
                .findByRoleName(name)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().roleName(name).description(description).build()));
    }
}
