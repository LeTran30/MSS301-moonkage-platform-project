package com.moonkage.catalog.controller.fee;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.catalog.common.exception.GlobalExceptionHandler;
import com.moonkage.catalog.entity.Province;
import com.moonkage.catalog.repository.InterprovinceFeeRepository;
import com.moonkage.catalog.repository.OutboxEventRepository;
import com.moonkage.catalog.service.impl.InterprovinceFeeServiceImpl;
import java.time.Clock;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class InterprovinceFeeControllerTest {
    private MockMvc mvc;
    private InterprovinceFeeRepository repository;

    @BeforeEach
    void setUp() {
        repository = org.mockito.Mockito.mock(InterprovinceFeeRepository.class);
        var service = new InterprovinceFeeServiceImpl(
                repository,
                org.mockito.Mockito.mock(OutboxEventRepository.class),
                new ObjectMapper().findAndRegisterModules(),
                Clock.systemUTC());
        mvc = MockMvcBuilders.standaloneSetup(new InterprovinceFeeController(service))
                .setControllerAdvice(
                        new GlobalExceptionHandler(new org.springframework.context.support.StaticMessageSource()))
                .build();
    }

    @Test
    void publicTableUsesEnvelopeAndExposesUnconfiguredRows() throws Exception {
        org.mockito.Mockito.when(repository.findProvinces()).thenReturn(List.of(new Province("01", "Hà Nội")));
        mvc.perform(get("/api/interprovince-fees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.complete").value(false))
                .andExpect(jsonPath("$.data.fees[0].provinceCode").value("01"));
    }

    @Test
    void validBodyStillRequiresAdminIdentity() throws Exception {
        String body = "{\"fees\":[{\"provinceCode\":\"01\",\"fee\":0}]}";
        mvc.perform(put("/api/interprovince-fees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("CAT_002"));
        mvc.perform(put("/api/interprovince-fees")
                        .header("X-Account-Id", "member")
                        .header("X-User-Role", "MEMBER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CAT_003"));
    }

    @Test
    void keepsUnsupportedMediaTypeAsClientError() throws Exception {
        mvc.perform(put("/api/interprovince-fees")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("fees"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void adminCanSaveZeroThroughHttp() throws Exception {
        org.mockito.Mockito.when(repository.lockProvinces()).thenReturn(List.of(new Province("01", "Hà Nội")));
        mvc.perform(put("/api/interprovince-fees")
                        .header("X-Account-Id", "admin")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fees\":[{\"provinceCode\":\"01\",\"fee\":0}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.complete").value(true))
                .andExpect(jsonPath("$.data.fees[0].fee").value(0));
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "{}",
                "{\"fees\":[]}",
                "{\"fees\":[null]}",
                "{\"fees\":[{\"provinceCode\":\"01\",\"fee\":-1}]}",
                "{\"fees\":[{\"provinceCode\":\"1\",\"fee\":0}]}",
                "{\"fees\":[{\"provinceCode\":\"01\"}]}",
                "{\"fees\":[{\"provinceCode\":\"01\",\"fee\":9223372036854775808}]}",
                "{\"fees\":[{\"provinceCode\":\"01\",\"fee\":1.5}]}",
                "{\"fees\":[{\"provinceCode\":\"01\",\"fee\":\"45000\"}]}",
                "not-json"
            })
    void rejectsInvalidBodyThroughBeanValidation(String body) throws Exception {
        mvc.perform(put("/api/interprovince-fees")
                        .header("X-Account-Id", "admin")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("CAT_001"));
    }
}
