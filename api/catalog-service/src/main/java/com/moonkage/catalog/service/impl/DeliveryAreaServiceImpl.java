package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.repository.DeliveryAreaRepository;
import com.moonkage.catalog.service.DeliveryAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DeliveryAreaServiceImpl implements DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;
}
