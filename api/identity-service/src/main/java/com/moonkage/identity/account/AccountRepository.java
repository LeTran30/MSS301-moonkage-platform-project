package com.moonkage.identity.account;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
interface AccountRepository extends JpaRepository<Account, String> {

    Optional<Account> findByEmail(Email email);

    Optional<Account> findByPhoneNumber(PhoneNumber phoneNumber);

    boolean existsByEmail(Email email);

    default boolean existsByEmail(String email) {
        return email != null && !email.isBlank() && existsByEmail(Email.of(email));
    }

    boolean existsByPhoneNumber(PhoneNumber phoneNumber);

    default boolean existsByPhoneNumber(String phoneNumber) {
        return phoneNumber != null && !phoneNumber.isBlank() && existsByPhoneNumber(PhoneNumber.of(phoneNumber));
    }

    /**
     * Row lock that serialises changes of one account: two requests cannot both set a default address (FR-03) or
     * both pass the NFC attempt counter (FR-04).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") String id);
}
