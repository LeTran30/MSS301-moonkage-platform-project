package com.bake2b.catalog.service;

import com.bake2b.catalog.repository.DeliveryAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-29. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;
}
