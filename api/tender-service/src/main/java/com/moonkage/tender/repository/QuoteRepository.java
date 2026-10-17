package com.moonkage.tender.repository;

import com.moonkage.tender.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<Quote, String> {}
