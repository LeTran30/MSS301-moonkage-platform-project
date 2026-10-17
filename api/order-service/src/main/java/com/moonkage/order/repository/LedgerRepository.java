package com.moonkage.order.repository;

import com.moonkage.order.entity.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerRepository extends JpaRepository<Ledger, String> {}
