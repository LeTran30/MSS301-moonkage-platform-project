package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.repository.OrderProfileRepository;
import com.moonkage.catalog.repository.RefPriceTierRepository;
import com.moonkage.catalog.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderProfileServiceImpl implements OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;
}
