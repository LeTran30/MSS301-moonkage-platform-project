package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.DeliveryAreaRepository;
import com.bake2b.catalog.service.DeliveryAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-29. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;
}
