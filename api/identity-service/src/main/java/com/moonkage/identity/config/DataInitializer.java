package com.moonkage.identity.config;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.UserProfile;
import com.moonkage.identity.enums.Role;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the platform admin on startup (idempotent): every environment needs one. Dev sample data is Flyway's
 * db/seed, not code (docs/guides/database.md).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.full-name}")
    private String adminFullName;

    @Override
    @Transactional
    public void run(String... args) {
        // stored like every other email, or login (which lower-cases) would never find the admin
        String email = Account.toStoredEmail(adminEmail);
        if (accountRepository.findByEmail(email).isEmpty()) {
            Account admin = accountRepository.save(Account.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .accountVerified(true)
                    .role(Role.ADMIN)
                    .build());
            userProfileRepository.save(
                    UserProfile.builder().account(admin).fullName(adminFullName).build());
            log.info("Seeded admin account {}", email);
        }
    }
}
