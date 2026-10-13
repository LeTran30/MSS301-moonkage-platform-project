package com.bake2b.catalog.service;

import com.bake2b.catalog.repository.OrderProfileRepository;
import com.bake2b.catalog.repository.RefPriceTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-14, FR-35. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;
}
