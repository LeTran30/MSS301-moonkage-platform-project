package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.ProductRepository;
import com.bake2b.catalog.repository.ProductPriceTierRepository;
import com.bake2b.catalog.repository.DeliveryAreaRepository;
import com.bake2b.catalog.repository.AuditLogRepository;
import com.bake2b.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductPriceTierRepository productPriceTierRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final AuditLogRepository auditLogRepository;
}
