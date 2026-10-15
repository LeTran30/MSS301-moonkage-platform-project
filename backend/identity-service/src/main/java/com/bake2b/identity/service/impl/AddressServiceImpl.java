package com.bake2b.identity.service.impl;

import com.bake2b.identity.repository.AddressRepository;
import com.bake2b.identity.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
}
