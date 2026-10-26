package com.moonkage.vendor.cakeattribute;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import java.util.Locale;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Phase 4 end to end on PostgreSQL: the catalogue of crusts and fillings (FR-54), from the migration's A-19 values. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class CakeAttributeIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    /** Every value of the migration has an id with this prefix. */
    private static final String SEEDED_ID_PREFIX = "a1f0c0de-";

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @MockitoBean
    private ObjectStorage objectStorage;

    @MockitoBean
    private IdentityClient identityClient;

    @MockitoBean
    private PaymentClient paymentClient;

    private final MockMvc mvc;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    CakeAttributeIntegrationTest(MockMvc mvc, JdbcTemplate jdbcTemplate) {
        this.mvc = mvc;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Values a test added go away and the starting ones are visible again, so every test starts from A-19. */
    @AfterEach
    void restoreTheStartingCatalogue() {
        jdbcTemplate.update("DELETE FROM cake_attributes WHERE id NOT LIKE ?", SEEDED_ID_PREFIX + "%");
        jdbcTemplate.update("UPDATE cake_attributes SET active = true");
    }

    @Test
    void aGuestReadsTheVisibleValuesOfAGroupInTheAdminOrder() throws Exception {
        mvc.perform(get("/api/cake-attributes").param("group", "CRUST"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].code", contains("banh-nuong", "banh-deo", "banh-lanh", "khac")))
                .andExpect(jsonPath("$.data[0].label").value("Bánh nướng"));
    }

    @Test
    void onlyAnAdminSeesHiddenValues() throws Exception {
        String id = create("FILLING", "Trà sữa");
        update(id, "{\"active\":false}").andExpect(status().isOk());

        mvc.perform(get("/api/cake-attributes").param("group", "FILLING"))
                .andExpect(jsonPath("$.data[*].code", not(hasItem("tra-sua"))));
        mvc.perform(as(Role.ADMIN, get("/api/cake-attributes").param("includeHidden", "true")))
                .andExpect(jsonPath("$.data[*].code", hasItem("tra-sua")));
        mvc.perform(get("/api/cake-attributes").param("includeHidden", "true")).andExpect(status().isUnauthorized());
        mvc.perform(as(Role.MEMBER, get("/api/cake-attributes").param("includeHidden", "true")))
                .andExpect(status().isForbidden());
    }

    @Test
    void theAdminAddsAValueWithACodeFromItsLabelAtTheEnd() throws Exception {
        mvc.perform(as(Role.ADMIN, post("/api/cake-attributes"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"group\":\"FILLING\",\"label\":\" Trà   sữa \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("tra-sua"))
                .andExpect(jsonPath("$.data.label").value("Trà sữa"))
                .andExpect(jsonPath("$.data.sortOrder").value(100))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void aLabelAlreadyInTheGroupIsRefusedNamingTheValue() throws Exception {
        mvc.perform(as(Role.ADMIN, post("/api/cake-attributes"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"group\":\"FILLING\",\"label\":\"dau XANH\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_020"))
                .andExpect(jsonPath("$.errors[0].field").value("label"))
                .andExpect(jsonPath("$.message").value(containsString("Đậu xanh")));
        // the same label in the other group is another value
        create("CRUST", "Đậu xanh");
    }

    @Test
    void aRenameKeepsTheCodeAndAReorderMovesTheValue() throws Exception {
        String id = create("CRUST", "Bánh mới");

        update(id, "{\"label\":\"Bánh nhân mới\",\"sortOrder\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("banh-moi"))
                .andExpect(jsonPath("$.data.label").value("Bánh nhân mới"));
        mvc.perform(get("/api/cake-attributes").param("group", "CRUST"))
                .andExpect(jsonPath("$.data[0].code").value("banh-moi"));
        update(id, "{\"label\":\"Bánh dẻo\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_020"));
        update(id, "{\"sortOrder\":-1}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("sortOrder"));
    }

    @Test
    void theLastVisibleValueOfAGroupCannotBeHidden() throws Exception {
        jdbcTemplate.update(
                "UPDATE cake_attributes SET active = false WHERE attribute_group = 'CRUST' AND code <> 'khac'");
        String lastId = jdbcTemplate.queryForObject(
                "SELECT id FROM cake_attributes WHERE attribute_group = 'CRUST' AND code = 'khac'", String.class);

        update(lastId, "{\"active\":false}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_021"));
    }

    @Test
    void onlyAnAdminChangesTheCatalogue() throws Exception {
        mvc.perform(as(Role.MEMBER, post("/api/cake-attributes"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"group\":\"CRUST\",\"label\":\"Bánh mới\"}"))
                .andExpect(status().isForbidden());
        update("missing", "{\"active\":true}").andExpect(status().isNotFound());
    }

    private String create(String group, String label) throws Exception {
        String body = mvc.perform(as(Role.ADMIN, post("/api/cake-attributes"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"group\":\"" + group + "\",\"label\":\"" + label + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.data.id");
    }

    private ResultActions update(String id, String body) throws Exception {
        return mvc.perform(as(Role.ADMIN, patch("/api/cake-attributes/{id}", id))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private static MockHttpServletRequestBuilder as(Role role, MockHttpServletRequestBuilder request) {
        return request.header(GatewayHeader.ACCOUNT_ID, role.name().toLowerCase(Locale.ROOT) + "-1")
                .header(GatewayHeader.USER_ROLE, role.name());
    }
}
