package com.moonkage.identity.config;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Role;
import com.moonkage.identity.entity.UserProfile;
import com.moonkage.identity.enums.AccountStatus;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.RoleRepository;
import com.moonkage.identity.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds roles, one platform admin and the demo seller account on startup (idempotent).
 * The seller's approved Shop is seeded by vendor-service (DemoVendorSeeder).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
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
            Account admin = accountRepository.save(activeAccount(adminEmail, null, adminPassword, adminRole));
            userProfileRepository.save(UserProfile.builder()
                    .account(admin)
                    .fullName("Quản trị viên MoonKage")
                    .build());
            log.info("Seeded admin account {}", adminEmail);
        }

        if (accountRepository.findByEmail(sellerEmail).isEmpty()) {
            Account owner =
                    accountRepository.save(activeAccount(sellerEmail, "0901234567", sellerPassword, sellerRole));
            userProfileRepository.save(UserProfile.builder()
                    .account(owner)
                    .fullName("Nguyễn Văn Bánh")
                    .build());
            log.info("Seeded seller account {}", sellerEmail);
        }
    }

    private Account activeAccount(String email, String phoneNumber, String rawPassword, Role role) {
        return Account.builder()
                .email(email)
                .phoneNumber(phoneNumber)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(AccountStatus.ACTIVE)
                .accountVerified(true)
                .role(role)
                .build();
    }

    private Role initializeRole(String name, String description) {
        return roleRepository
                .findByRoleName(name)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().roleName(name).description(description).build()));
    }
}
