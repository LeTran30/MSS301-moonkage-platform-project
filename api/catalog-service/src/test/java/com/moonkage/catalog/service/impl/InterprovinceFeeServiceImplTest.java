package com.moonkage.catalog.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.dto.request.SaveInterprovinceFeesRequest;
import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.OutboxEvent;
import com.moonkage.catalog.entity.Province;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.repository.InterprovinceFeeRepository;
import com.moonkage.catalog.repository.OutboxEventRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InterprovinceFeeServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-26T07:00:00Z");
    private static final List<Province> PROVINCES = List.of(new Province("01", "Hà Nội"), new Province("79", "TP.HCM"));

    @Mock
    private InterprovinceFeeRepository feeRepository;

    @Mock
    private OutboxEventRepository outboxRepository;

    private InterprovinceFeeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new InterprovinceFeeServiceImpl(
                feeRepository,
                outboxRepository,
                new ObjectMapper().findAndRegisterModules(),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void savesWholeTableIncludingZeroAndAuditsBeforeAndAfter() throws Exception {
        when(feeRepository.lockProvinces()).thenReturn(PROVINCES);
        when(feeRepository.findFees())
                .thenReturn(List.of(new InterprovinceFee("01", 40000, NOW.minusSeconds(1), "old")));
        var response = service.replace("admin", "ADMIN", request(0L, Long.MAX_VALUE));
        assertThat(response.complete()).isTrue();
        assertThat(response.fees()).extracting(row -> row.fee()).containsExactly(0L, Long.MAX_VALUE);
        ArgumentCaptor<OutboxEvent> event = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(event.capture());
        var json = new ObjectMapper().readTree(event.getValue().payload());
        assertThat(json.get("eventId").asText()).isEqualTo(event.getValue().id());
        assertThat(json.get("before").get("complete").asBoolean()).isFalse();
        assertThat(json.get("before").get("fees").get(0).get("fee").asLong()).isEqualTo(40000);
        assertThat(json.get("after").get("complete").asBoolean()).isTrue();
        assertThat(event.getValue().routingKey()).isEqualTo("interprovince_fee.changed");
        assertThat(event.getValue().createdAt()).isEqualTo(NOW);
    }

    @Test
    void checksAdminBeforeLockingOrWriting() {
        assertCode(() -> service.replace(null, null, request(1L, 2L)), CatalogErrorCode.UNAUTHENTICATED);
        assertCode(() -> service.replace("member", "MEMBER", request(1L, 2L)), CatalogErrorCode.FORBIDDEN);
        verify(feeRepository, never()).lockProvinces();
        verify(feeRepository, never()).saveFees(any());
        verify(outboxRepository, never()).save(any());
    }

    @ParameterizedTest
    @MethodSource("invalidTables")
    void refusesInvalidTableWithoutWriting(SaveInterprovinceFeesRequest request) {
        when(feeRepository.lockProvinces()).thenReturn(PROVINCES);
        assertThatThrownBy(() -> service.replace("admin", "ADMIN", request)).isInstanceOf(CatalogException.class);
        verify(feeRepository, never()).saveFees(any());
        verify(outboxRepository, never()).save(any());
    }

    static List<SaveInterprovinceFeesRequest> invalidTables() {
        return Arrays.asList(
                null,
                new SaveInterprovinceFeesRequest(null),
                new SaveInterprovinceFeesRequest(List.of()),
                new SaveInterprovinceFeesRequest(List.of(fee("01", 1L))),
                new SaveInterprovinceFeesRequest(List.of(fee("01", 1L), fee("01", 2L))),
                new SaveInterprovinceFeesRequest(List.of(fee("01", 1L), fee("99", 2L))),
                new SaveInterprovinceFeesRequest(List.of(fee("01", 1L), fee("79", 2L), fee("99", 3L))),
                request(-1L, 1L),
                request(null, 1L),
                new SaveInterprovinceFeesRequest(Arrays.asList(fee("01", 1L), null)));
    }

    @Test
    void showsUnconfiguredRowsWithoutInventingFreeDelivery() {
        when(feeRepository.findProvinces()).thenReturn(PROVINCES);
        when(feeRepository.findFees()).thenReturn(List.of());
        assertThat(service.getTable().complete()).isFalse();
        assertThat(service.getTable().fees()).extracting(row -> row.fee()).containsOnlyNulls();
        assertCode(() -> service.getProvinceFee("01"), CatalogErrorCode.FEE_NOT_CONFIGURED);
        assertCode(() -> service.getProvinceFee("99"), CatalogErrorCode.PROVINCE_NOT_FOUND);
    }

    @Test
    void refusesWriteWhenProvinceReferenceIsEmpty() {
        when(feeRepository.lockProvinces()).thenReturn(List.of());
        assertCode(() -> service.replace("admin", "ADMIN", request(1L, 2L)), CatalogErrorCode.INCOMPLETE_FEE_TABLE);
        verify(feeRepository, never()).saveFees(any());
    }

    @Test
    void doesNotWriteFeesWhenEventCannotBeSerialized() throws Exception {
        ObjectMapper mapper = org.mockito.Mockito.mock(ObjectMapper.class);
        when(mapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("test") {});
        service = new InterprovinceFeeServiceImpl(
                feeRepository, outboxRepository, mapper, Clock.fixed(NOW, ZoneOffset.UTC));
        when(feeRepository.lockProvinces()).thenReturn(PROVINCES);
        when(feeRepository.findFees()).thenReturn(List.of());
        assertThatThrownBy(() -> service.replace("admin", "ADMIN", request(1L, 2L)))
                .isInstanceOf(IllegalStateException.class);
        verify(feeRepository, never()).saveFees(any());
    }

    private static SaveInterprovinceFeesRequest request(Long north, Long south) {
        return new SaveInterprovinceFeesRequest(List.of(fee("01", north), fee("79", south)));
    }

    private static SaveInterprovinceFeesRequest.Fee fee(String code, Long amount) {
        return new SaveInterprovinceFeesRequest.Fee(code, amount);
    }

    private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, CatalogErrorCode code) {
        assertThatThrownBy(call)
                .isInstanceOfSatisfying(
                        CatalogException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(code));
    }
}
