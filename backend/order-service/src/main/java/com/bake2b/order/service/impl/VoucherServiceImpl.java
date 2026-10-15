package com.bake2b.order.service.impl;

import com.bake2b.order.repository.VoucherRepository;
import com.bake2b.order.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-13, FR-52. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
}
