package com.bake2b.order.repository;

import com.bake2b.order.entity.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerRepository extends JpaRepository<Ledger, String> {
}
