package com.moonkage.vendor;

import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * The real application over HTTP on PostgreSQL: caller from the gateway headers, ApiResponse on success and error,
 * internal API unwrapped. The broker and MinIO are mocked. Skipped when Docker is not running.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class VendorApiIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String ACCOUNT_ID = "account-1";

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @MockitoBean
    private ObjectStorage objectStorage;

    private final MockMvc mvc;

    @Autowired
    VendorApiIntegrationTest(MockMvc mvc) {
        this.mvc = mvc;
    }

    @Test
    void anOperationNotWrittenYetAnswersNotImplementedInTheApiResponseShape() throws Exception {
        mvc.perform(post("/api/vendors/uploads")
                        .header(GatewayHeader.ACCOUNT_ID, ACCOUNT_ID)
                        .header(GatewayHeader.USER_ROLE, Role.MEMBER.name()))
                .andExpect(status().isNotImplemented())
                .andExpect(jsonPath("$.status").value(501))
                .andExpect(jsonPath("$.code").value("COMMON_501"))
                .andExpect(jsonPath("$.message").value(notNullValue()))
                .andExpect(jsonPath("$.data").value(nullValue()))
                .andExpect(jsonPath("$.path").value("/api/vendors/uploads"));
    }

    @Test
    void aRequestWithoutGatewayHeadersIsUnauthenticated() throws Exception {
        mvc.perform(post("/api/vendors/uploads"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("COMMON_401"));
    }

    @Test
    void anUnknownRoleIsUnauthenticated() throws Exception {
        mvc.perform(post("/api/vendors/uploads")
                        .header(GatewayHeader.ACCOUNT_ID, ACCOUNT_ID)
                        .header(GatewayHeader.USER_ROLE, "ROOT"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("COMMON_401"));
    }

    @Test
    void anUnknownStatusFilterIsABadRequest() throws Exception {
        mvc.perform(get("/api/vendors")
                        .param("status", "SLEEPING")
                        .header(GatewayHeader.ACCOUNT_ID, ACCOUNT_ID)
                        .header(GatewayHeader.USER_ROLE, Role.ADMIN.name()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400_JSON"));
    }

    @Test
    void anUnknownPathIsNotFoundInTheApiResponseShape() throws Exception {
        mvc.perform(get("/api/nothing-here"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMON_404"));
    }

    @Test
    void theInternalLookupOfAnAccountWithoutVendorIsAnEmptyNotFound() throws Exception {
        mvc.perform(get("/internal/vendors/by-owner/{accountId}", "nobody"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));
    }
}
