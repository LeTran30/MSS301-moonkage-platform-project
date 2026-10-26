package com.moonkage.identity.account;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.profile.UserProfileService;
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
class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final UserProfileService userProfileService;
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
        Email email = Email.of(adminEmail);
        if (accountRepository.findByEmail(email).isEmpty()) {
            Account admin = accountRepository.save(Account.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .accountVerified(true)
                    .role(Role.ADMIN)
                    .build());
            userProfileService.createProfile(admin.getId(), adminFullName);
            log.info("Seeded admin account {}", email);
        }
    }
}
