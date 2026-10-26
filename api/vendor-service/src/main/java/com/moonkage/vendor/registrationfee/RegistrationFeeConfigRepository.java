package com.moonkage.vendor.registrationfee;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface RegistrationFeeConfigRepository extends JpaRepository<RegistrationFeeConfig, String> {

    /** The level in effect at {@code at}: the latest one that had started by then. */
    Optional<RegistrationFeeConfig> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(Instant at);
}
