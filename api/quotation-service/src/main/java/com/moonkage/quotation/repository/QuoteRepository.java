package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<Quote, String> {}
