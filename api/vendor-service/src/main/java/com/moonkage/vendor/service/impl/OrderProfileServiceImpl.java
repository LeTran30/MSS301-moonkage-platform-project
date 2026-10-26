package com.moonkage.vendor.service.impl;

import com.moonkage.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.dto.response.OrderProfileResponse;
import com.moonkage.vendor.repository.OrderProfileRepository;
import com.moonkage.vendor.repository.RefPriceTierRepository;
import com.moonkage.vendor.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderProfileServiceImpl implements OrderProfileService {

    private final OrderProfileRepository orderProfileRepository;
    private final RefPriceTierRepository refPriceTierRepository;

    @Override
    public OrderProfileResponse getOrderProfile(String accountId, String vendorId) {
        return null;
    }

    @Override
    public OrderProfileResponse saveOrderProfile(String accountId, String vendorId, SaveOrderProfileRequest request) {
        return null;
    }
}
