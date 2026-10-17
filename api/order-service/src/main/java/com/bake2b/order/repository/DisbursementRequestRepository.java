package com.bake2b.order.repository;

import com.bake2b.order.entity.DisbursementRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisbursementRequestRepository extends JpaRepository<DisbursementRequest, String> {}
