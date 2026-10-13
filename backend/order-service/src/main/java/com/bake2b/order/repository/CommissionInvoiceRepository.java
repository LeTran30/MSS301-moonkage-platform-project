package com.bake2b.order.repository;

import com.bake2b.order.entity.CommissionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommissionInvoiceRepository extends JpaRepository<CommissionInvoice, String> {
}
