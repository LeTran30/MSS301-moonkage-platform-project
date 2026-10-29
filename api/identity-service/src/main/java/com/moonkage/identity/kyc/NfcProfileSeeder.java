package com.moonkage.identity.kyc;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.identity.account.AccountService;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Dev seed of the NFC results in db/seed/nfc-profiles.json (docs/guides/database.md). The rest of the seed is SQL,
 * but a LegalProfile stores the ID number encrypted with this environment's PII key, which SQL cannot do. Only active
 * with {@code app.seed.enabled=true} (docker-compose); skips accounts that are missing or already verified.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
class NfcProfileSeeder implements ApplicationRunner {

    private static final String PROFILES_FILE = "db/seed/nfc-profiles.json";

    private final AccountService accountService;
    private final LegalProfileRepository legalProfileRepository;
    private final IdNumberHasher idNumberHasher;
    private final PiiCipher piiCipher;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        List<SeedProfile> profiles = readProfiles();
        try {
            Integer created = transactionTemplate.execute(status -> seed(profiles));
            log.info("NFC seed: {} profile(s) created", created);
        } catch (RuntimeException e) {
            // e.g. PII_ENC_KEY_V1 / ID_HASH_PEPPER_V1 not set on this machine: dev data must never stop the service
            log.warn("NFC seed skipped: {}", e.getMessage());
        }
    }

    private List<SeedProfile> readProfiles() throws IOException {
        try (InputStream in = new ClassPathResource(PROFILES_FILE).getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<>() {});
        }
    }

    private int seed(List<SeedProfile> profiles) {
        int created = 0;
        for (SeedProfile seed : profiles) {
            if (isSeedable(seed)) {
                legalProfileRepository.save(toLegalProfile(seed));
                created++;
            }
        }
        return created;
    }

    /** The account was seeded (not taken by a hand-made one), is not verified yet, and its ID number is free. */
    private boolean isSeedable(SeedProfile seed) {
        return accountService.findAccount(seed.accountId()).isPresent()
                && !legalProfileRepository.existsById(seed.accountId())
                && !legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer(
                        idNumberHasher.hash(seed.idNumber()), IdNumberHasher.KEY_VERSION);
    }

    /** Same fields and protection as a real verification (NfcServiceImpl.saveLegalProfile). */
    private LegalProfile toLegalProfile(SeedProfile seed) {
        return LegalProfile.builder()
                .accountId(seed.accountId())
                .legalName(seed.legalName())
                .gender(seed.gender())
                .nationality(seed.nationality())
                .idNumberHash(idNumberHasher.hash(seed.idNumber()))
                .idHashKeyVer(IdNumberHasher.KEY_VERSION)
                .idNumberMasked(IdNumberHasher.mask(seed.idNumber()))
                .idNumberEnc(piiCipher.encrypt(seed.idNumber()))
                .dateOfBirthEnc(piiCipher.encrypt(seed.dateOfBirth().toString()))
                .piiKeyVer(PiiCipher.KEY_VERSION)
                .nfcVerifiedAt(Instant.now())
                .build();
    }

    record SeedProfile(
            String accountId,
            String legalName,
            Gender gender,
            String nationality,
            String idNumber,
            LocalDate dateOfBirth) {}
}
