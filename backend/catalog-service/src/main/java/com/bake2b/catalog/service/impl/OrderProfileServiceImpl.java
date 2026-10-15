package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.OrderProfileRepository;
import com.bake2b.catalog.repository.RefPriceTierRepository;
import com.bake2b.catalog.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderProfileServiceImpl implements OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;
}
