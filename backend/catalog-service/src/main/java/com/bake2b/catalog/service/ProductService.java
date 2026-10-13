package com.bake2b.catalog.service;

import com.bake2b.catalog.repository.ProductRepository;
import com.bake2b.catalog.repository.ProductPriceTierRepository;
import com.bake2b.catalog.repository.DeliveryAreaRepository;
import com.bake2b.catalog.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-04 - FR-07, FR-30 - FR-32, FR-47. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductPriceTierRepository productPriceTierRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final AuditLogRepository auditLogRepository;
}
