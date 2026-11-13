package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Withdrawal;
import com.moonkage.payment.enums.WithdrawalStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, String> {

    /** Row lock: one admin decision per request. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Withdrawal w where w.id = :id")
    Optional<Withdrawal> findForUpdateById(String id);

    List<Withdrawal> findByAccountIdOrderByCreatedAtDesc(String accountId);

    Page<Withdrawal> findByStatusOrderByCreatedAtAsc(WithdrawalStatus status, Pageable pageable);

    long countByStatus(WithdrawalStatus status);

    @Query("select coalesce(sum(w.amount), 0) from Withdrawal w where w.status = :status")
    long sumAmountByStatus(WithdrawalStatus status);
}
