package com.bake2b.tender.repository;

import com.bake2b.tender.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<Quote, String> {}
