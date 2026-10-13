package com.bake2b.tender.repository;

import com.bake2b.tender.entity.TenderRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenderRequestRepository extends JpaRepository<TenderRequest, String> {
}
