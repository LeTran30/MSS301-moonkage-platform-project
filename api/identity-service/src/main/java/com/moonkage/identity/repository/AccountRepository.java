package com.moonkage.identity.repository;

import com.moonkage.identity.entity.Account;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    Optional<Account> findByEmail(String email);

    Optional<Account> findByPhoneNumber(String phoneNumber);

    @Query("SELECT CASE " + "WHEN COUNT(CASE WHEN a.email = :email THEN 1 END) > 0 THEN 'EMAIL_EXISTS' "
            + "WHEN COUNT(CASE WHEN a.phoneNumber = :phoneNumber THEN 1 END) > 0 THEN 'PHONE_EXISTS' "
            + "ELSE 'VALID' END "
            + "FROM Account a WHERE a.email = :email OR a.phoneNumber = :phoneNumber")
    String validateAccountUniqueness(@Param("email") String email, @Param("phoneNumber") String phoneNumber);
}
