package com.bake2b.catalog.repository;

import com.bake2b.catalog.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, String> {}
