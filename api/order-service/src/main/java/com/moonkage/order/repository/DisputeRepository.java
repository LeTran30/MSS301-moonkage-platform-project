package com.moonkage.order.repository;

import com.moonkage.order.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeRepository extends JpaRepository<Dispute, String> {}
