package com.bake2b.identity.config;

import com.bake2b.identity.entity.Account;
import com.bake2b.identity.entity.Role;
import com.bake2b.identity.entity.User;
import com.bake2b.identity.enums.AccountStatus;
import com.bake2b.identity.repository.AccountRepository;
import com.bake2b.identity.repository.RoleRepository;
import com.bake2b.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds roles and one platform admin on startup (idempotent). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initializeRole("CUSTOMER", "Người dùng (mua và/hoặc chủ người bán)");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên MoonKage");

        if (accountRepository.findByEmail(adminEmail).isEmpty()) {
            Account admin = accountRepository.save(Account.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .status(AccountStatus.ACTIVE)
                    .accountVerified(true)
                    .role(adminRole)
                    .build());
            userRepository.save(User.builder().fullName("Quản trị viên MoonKage").email(adminEmail).account(admin).build());
            log.info("Seeded admin account {}", adminEmail);
        }
    }

    private Role initializeRole(String name, String description) {
        return roleRepository.findByRoleName(name)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(name).description(description).build()));
    }
}
