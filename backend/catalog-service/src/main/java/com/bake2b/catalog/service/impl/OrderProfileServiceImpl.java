package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.OrderProfileRepository;
import com.bake2b.catalog.repository.RefPriceTierRepository;
import com.bake2b.catalog.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-14, FR-35. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class OrderProfileServiceImpl implements OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;
}
