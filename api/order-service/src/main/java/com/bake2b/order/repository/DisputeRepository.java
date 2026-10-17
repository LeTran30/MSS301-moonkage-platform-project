package com.bake2b.order.repository;

import com.bake2b.order.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeRepository extends JpaRepository<Dispute, String> {}
