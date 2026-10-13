package com.bake2b.identity.service;

import com.bake2b.identity.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-03. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
}
