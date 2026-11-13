package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Wallet;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface WalletRepository extends JpaRepository<Wallet, String> {

    /** Row lock: one movement of a wallet at a time, so a balance is never spent twice. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.accountId = :accountId")
    Optional<Wallet> findForUpdateByAccountId(String accountId);

    /** What the platform owes all buyers together (admin overview). */
    @Query("select coalesce(sum(w.balance), 0) from Wallet w")
    long totalBalance();
}
