package com.moonkage.catalog.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.dto.request.SaveInterprovinceFeesRequest;
import com.moonkage.catalog.dto.response.InterprovinceFeeResponse;
import com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse;
import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.OutboxEvent;
import com.moonkage.catalog.entity.Province;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.mapper.InterprovinceFeeMapper;
import com.moonkage.catalog.messaging.InterprovinceFeeChangedEvent;
import com.moonkage.catalog.repository.InterprovinceFeeRepository;
import com.moonkage.catalog.repository.OutboxEventRepository;
import com.moonkage.catalog.service.InterprovinceFeeService;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterprovinceFeeServiceImpl implements InterprovinceFeeService {
    public static final String CHANGED_ROUTING_KEY = "interprovince_fee.changed";

    private final InterprovinceFeeRepository feeRepository;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Override
    @Transactional
    public InterprovinceFeeTableResponse replace(String accountId, String role, SaveInterprovinceFeesRequest request) {
        requireAdmin(accountId, role);
        List<Province> provinces = feeRepository.lockProvinces();
        validateTable(request, provinces);
        InterprovinceFeeTableResponse before = InterprovinceFeeMapper.toResponse(provinces, feeRepository.findFees());
        Instant at = clock.instant();
        List<InterprovinceFee> fees = request.fees().stream()
                .map(row -> new InterprovinceFee(row.provinceCode(), row.fee(), at, accountId))
                .toList();
        InterprovinceFeeTableResponse after = InterprovinceFeeMapper.toResponse(provinces, fees);
        InterprovinceFeeChangedEvent event =
                new InterprovinceFeeChangedEvent(UUID.randomUUID().toString(), accountId, at, before, after);
        String payload = serialize(event);
        feeRepository.saveFees(fees);
        outboxRepository.save(new OutboxEvent(event.eventId(), CHANGED_ROUTING_KEY, payload, 0, at));
        return after;
    }

    @Override
    public InterprovinceFeeTableResponse getTable() {
        return InterprovinceFeeMapper.toResponse(feeRepository.findProvinces(), feeRepository.findFees());
    }

    @Override
    public InterprovinceFeeResponse getProvinceFee(String provinceCode) {
        InterprovinceFeeResponse row = getTable().fees().stream()
                .filter(fee -> fee.provinceCode().equals(provinceCode))
                .findFirst()
                .orElseThrow(() -> new CatalogException(CatalogErrorCode.PROVINCE_NOT_FOUND));
        if (row.fee() == null) {
            throw new CatalogException(CatalogErrorCode.FEE_NOT_CONFIGURED);
        }
        return row;
    }

    private void requireAdmin(String accountId, String role) {
        if (accountId == null || accountId.isBlank() || role == null || role.isBlank()) {
            throw new CatalogException(CatalogErrorCode.UNAUTHENTICATED);
        }
        if (!"ADMIN".equals(role)) {
            throw new CatalogException(CatalogErrorCode.FORBIDDEN);
        }
    }

    private void validateTable(SaveInterprovinceFeesRequest request, List<Province> provinces) {
        if (request == null || request.fees() == null || request.fees().isEmpty()) {
            throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
        }
        Set<String> codes = new HashSet<>();
        for (SaveInterprovinceFeesRequest.Fee row : request.fees()) {
            if (row == null || row.provinceCode() == null || row.fee() == null || row.fee() < 0) {
                throw new CatalogException(CatalogErrorCode.INVALID_REQUEST);
            }
            if (!codes.add(row.provinceCode())) {
                throw new CatalogException(CatalogErrorCode.INCOMPLETE_FEE_TABLE);
            }
        }
        Set<String> expected = provinces.stream().map(Province::code).collect(Collectors.toSet());
        if (expected.isEmpty() || !codes.equals(expected)) {
            throw new CatalogException(CatalogErrorCode.INCOMPLETE_FEE_TABLE);
        }
    }

    private String serialize(InterprovinceFeeChangedEvent event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Cannot serialize interprovince fee event", exception);
        }
    }
}
