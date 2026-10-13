package com.bake2b.catalog.repository;

import com.bake2b.catalog.entity.ProductPriceTier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductPriceTierRepository extends JpaRepository<ProductPriceTier, String> {
}
