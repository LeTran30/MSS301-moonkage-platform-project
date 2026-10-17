package com.moonkage.payment.repository;

import com.moonkage.payment.entity.DisbursementRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisbursementRequestRepository extends JpaRepository<DisbursementRequest, String> {}
