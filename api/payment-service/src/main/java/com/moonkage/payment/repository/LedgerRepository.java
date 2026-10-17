package com.moonkage.payment.repository;

import com.moonkage.payment.entity.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerRepository extends JpaRepository<Ledger, String> {}
