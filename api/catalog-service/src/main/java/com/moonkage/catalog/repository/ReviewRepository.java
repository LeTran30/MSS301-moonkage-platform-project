package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, String> {}
