package com.moonkage.order.service.impl;

import com.moonkage.order.repository.VoucherRepository;
import com.moonkage.order.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
}
