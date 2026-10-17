package com.moonkage.order.repository;

import com.moonkage.order.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, String> {}
