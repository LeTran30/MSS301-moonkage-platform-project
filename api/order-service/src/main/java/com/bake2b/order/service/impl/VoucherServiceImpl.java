package com.bake2b.order.service.impl;

import com.bake2b.order.repository.VoucherRepository;
import com.bake2b.order.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
}
