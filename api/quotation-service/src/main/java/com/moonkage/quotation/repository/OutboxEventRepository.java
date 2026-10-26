package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {}
