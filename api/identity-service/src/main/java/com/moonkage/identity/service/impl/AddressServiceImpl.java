package com.moonkage.identity.service.impl;

import com.moonkage.identity.repository.AddressRepository;
import com.moonkage.identity.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
}
