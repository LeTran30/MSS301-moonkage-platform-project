package com.moonkage.catalog.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.repository.ProjectionInboxRepository;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProjectionInboxServiceImplTest {
    @Mock
    private ProjectionInboxRepository repository;

    private ProjectionInboxServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ProjectionInboxServiceImpl(repository, new ObjectMapper());
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "{}",
                "null",
                "[]",
                "{",
                "{\"eventId\":1}",
                "{\"eventId\":\"\"}",
                "{\"eventId\":\"a\",\"eventId\":\"b\"}",
                "{\"eventId\":\"a\"} {\"eventId\":\"b\"}"
            })
    void rejectsAmbiguousOrMissingIdentityWithoutWriting(String json) {
        assertThatThrownBy(() -> service.capture("product.upserted", json.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).capture(any(), any(), any());
    }

    @Test
    void acceptsOnlyKnownRoutingKeysAndDatabaseSizedIdentity() {
        byte[] valid = "{\"eventId\":\"one\"}".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> service.capture(null, valid)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.capture("unknown", valid)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.capture("product.upserted", null))
                .isInstanceOf(IllegalArgumentException.class);
        byte[] tooLong = ("{\"eventId\":\"" + "x".repeat(65) + "\"}").getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> service.capture("product.upserted", tooLong))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).capture(any(), any(), any());
    }

    @Test
    void retainsUnknownFieldsWithoutDecodingBusinessData() {
        String payload = "{\"eventId\":\"one\",\"opaque\":{\"anything\":true}}";
        when(repository.capture("one", "vendor.locked", payload)).thenReturn(true);
        assertThat(service.capture("vendor.locked", payload.getBytes(StandardCharsets.UTF_8)))
                .isTrue();
        verify(repository).capture("one", "vendor.locked", payload);
    }

    @Test
    void pendingReadHasBoundedBatchSize() {
        assertThatThrownBy(() -> service.findPending(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.findPending(1001)).isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).findPending(org.mockito.ArgumentMatchers.anyInt());
    }
}
