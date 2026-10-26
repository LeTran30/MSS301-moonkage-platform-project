package com.moonkage.vendor.product;

import static org.hamcrest.Matchers.contains;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import com.moonkage.vendor.vendor.SupplySource;
import com.moonkage.vendor.vendor.VendorFixture;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ApplicationContext;
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

/**
 * Phase 5 end to end on PostgreSQL: a Shop writes its products (FR-29 to FR-34), an admin removes one (FR-46), and
 * each change announces the product (product.upserted / product.removed). The broker, MinIO, identity and payment
 * are mocked; a temp key starts with "tmp/".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class ProductIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String ADMIN_ID = "admin-1";
    private static final String TEMP_PREFIX = "tmp/";
    private static final String BUSINESS_NAME = "Tiệm bánh Trăng";
    private static final LocalDate EXPIRY_DATE = LocalDate.of(2026, 12, 31);

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @MockitoBean
    private ObjectStorage objectStorage;

    @MockitoBean
    private IdentityClient identityClient;

    @MockitoBean
    private PaymentClient paymentClient;

    private final MockMvc mvc;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final VendorFixture vendorFixture;

    private String ownerId;

    @Autowired
    ProductIntegrationTest(
            MockMvc mvc, ObjectMapper objectMapper, JdbcTemplate jdbcTemplate, ApplicationContext context) {
        this.mvc = mvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.vendorFixture = new VendorFixture(context);
    }

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID().toString();
        when(objectStorage.isTempKey(anyString()))
                .thenAnswer(call -> call.<String>getArgument(0).startsWith(TEMP_PREFIX));
        when(objectStorage.moveUploadedFile(anyString(), any(), eq(BucketAccess.PUBLIC), anyString()))
                .thenAnswer(call -> call.<String>getArgument(3) + "/"
                        + call.<String>getArgument(0).substring(TEMP_PREFIX.length()));
        when(objectStorage.toPublicUrl(anyString())).thenAnswer(call -> "https://cdn.test/" + call.getArgument(0));
    }

    // ─── create (FR-29) ───

    @Test
    void aShopCreatesAProductOnSaleAndAnnouncesIt() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);

        JsonNode product = created(vendorId, productBody());

        assertEquals("ON_SALE", product.get("status").asText());
        // no brand typed: the business name (AC-29.4)
        assertEquals(BUSINESS_NAME, product.get("brand").asText());
        String imageKey = "products/" + vendorId + "/a.jpg";
        assertEquals(imageKey, product.get("images").get(0).get("key").asText());
        assertEquals(
                "https://cdn.test/" + imageKey,
                product.get("images").get(0).get("url").asText());

        JsonNode envelope = lastEnvelope(
                RabbitConfig.PRODUCT_UPSERTED_ROUTING_KEY, product.get("id").asText());
        assertEquals("PRODUCT", envelope.get("aggregateType").asText());
        assertEquals(
                product.get("version").asLong(), envelope.get("sourceVersion").asLong());
        JsonNode data = envelope.get("data");
        assertEquals(vendorId, data.get("vendorId").asText());
        assertEquals(imageKey, data.get("imageKeys").get(0).asText());
        assertEquals("banh-nuong", data.get("crustCodes").get(0).asText());
        assertEquals(50, data.get("priceTiers").get(0).get("fromQty").asInt());
        assertTrue(data.has("origin") && data.get("origin").isNull());
    }

    @Test
    void aProductMissingAFillingOrWithAnUnknownImageNamesTheField() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);

        ObjectNode noFilling = productBody();
        noFilling.remove("fillingCodes");
        create(vendorId, noFilling)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400_REQUIRED"))
                .andExpect(jsonPath("$.errors[0].field").value("fillingCodes"));

        // a key that is no upload and no image of this product: someone else's file (P-09)
        create(vendorId, productBody().set("imageKeys", objectMapper.valueToTree(List.of("products/x/a.jpg"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_030"))
                .andExpect(jsonPath("$.errors[0].field").value("imageKeys"));
        verify(objectStorage, never()).moveUploadedFile(anyString(), any(), any(), anyString());
    }

    @Test
    void aResellerNeedsBrandAndOrigin() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.RESELL, true);

        create(vendorId, productBody())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_028"))
                .andExpect(jsonPath("$.errors[0].field").value("brand"));

        JsonNode product =
                created(vendorId, productBody().put("brand", "Kinh Đô").put("origin", "Hà Nội"));
        assertTrue(product.get("resold").asBoolean());
    }

    @Test
    void onlyAnOwnerWhoMayOperateAndSellsInTheShopWritesProducts() throws Exception {
        String unpaid = vendorFixture.saveUnpaid(ownerId);
        create(unpaid, productBody())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_024"));

        // one vendor per account: a new owner for each
        ownerId = UUID.randomUUID().toString();
        String ordersOnly = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, false);
        create(ordersOnly, productBody())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_025"));

        ownerId = UUID.randomUUID().toString();
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        mvc.perform(as(UUID.randomUUID().toString(), Role.MEMBER, post("/api/vendors/{id}/products", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productBody().toString()))
                .andExpect(status().isForbidden());
    }

    // ─── replace (FR-30, FR-32, FR-33) ───

    @Test
    void aReplaceKeepsAndAddsImagesAndRaisesTheVersionEvenForAPriceTierAlone() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        JsonNode product = created(vendorId, productBody());
        String productId = product.get("id").asText();
        String kept = product.get("images").get(0).get("key").asText();

        ObjectNode body = productBody()
                .put("version", product.get("version").asLong())
                .set("imageKeys", objectMapper.valueToTree(List.of(TEMP_PREFIX + "b.jpg", kept)));
        body.set("priceTiers", objectMapper.readTree("[{\"fromQty\":50,\"unitPrice\":85000}]"));
        JsonNode replaced = replaced(vendorId, productId, body);

        assertEquals(
                List.of("products/" + vendorId + "/b.jpg", kept),
                List.of(
                        replaced.get("images").get(0).get("key").asText(),
                        replaced.get("images").get(1).get("key").asText()));
        assertEquals(85_000, replaced.get("priceTiers").get(0).get("unitPrice").asLong());
        assertTrue(replaced.get("version").asLong() > product.get("version").asLong());
        assertEquals(
                replaced.get("version").asLong(),
                lastEnvelope(RabbitConfig.PRODUCT_UPSERTED_ROUTING_KEY, productId)
                        .get("sourceVersion")
                        .asLong());

        // dropping an image deletes its file once committed
        replaced(
                vendorId,
                productId,
                productBody()
                        .put("version", replaced.get("version").asLong())
                        .set("imageKeys", objectMapper.valueToTree(List.of(kept))));
        verify(objectStorage).deleteQuietly(BucketAccess.PUBLIC, "products/" + vendorId + "/b.jpg");
    }

    @Test
    void aReplaceOfAVersionNotSeenIsRefused() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        JsonNode product = created(vendorId, productBody());
        String productId = product.get("id").asText();
        long seen = product.get("version").asLong();

        replaced(vendorId, productId, productBody().put("version", seen).put("stock", 3));
        replace(vendorId, productId, productBody().put("version", seen).put("stock", 7))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_027"));
        replace(vendorId, productId, productBody())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("version"));
    }

    @Test
    void aHiddenCrustStaysOnAProductThatHasIt() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        JsonNode product =
                created(vendorId, productBody().set("crustCodes", objectMapper.valueToTree(List.of("banh-deo"))));
        jdbcTemplate.update("UPDATE cake_attributes SET active = false WHERE code = 'banh-deo'");
        try {
            replaced(
                    vendorId,
                    product.get("id").asText(),
                    productBody()
                            .put("version", product.get("version").asLong())
                            .set("crustCodes", objectMapper.valueToTree(List.of("banh-deo"))));
            create(vendorId, productBody().set("crustCodes", objectMapper.valueToTree(List.of("banh-deo"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VENDOR_022"))
                    .andExpect(jsonPath("$.errors[0].field").value("crustCodes"));
        } finally {
            jdbcTemplate.update("UPDATE cake_attributes SET active = true WHERE code = 'banh-deo'");
        }
    }

    // ─── hide, show (FR-34), remove (FR-46) ───

    @Test
    void aShopHidesAndShowsItsProduct() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        String productId = created(vendorId, productBody()).get("id").asText();

        changeStatus(asOwner(vendorId, productId), "{\"status\":\"HIDDEN\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"));
        assertEquals(
                "HIDDEN",
                lastEnvelope(RabbitConfig.PRODUCT_UPSERTED_ROUTING_KEY, productId)
                        .get("data")
                        .get("status")
                        .asText());
        changeStatus(asOwner(vendorId, productId), "{\"status\":\"HIDDEN\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMON_409"));
        changeStatus(asOwner(vendorId, productId), "{\"status\":\"ON_SALE\"}")
                .andExpect(jsonPath("$.data.status").value("ON_SALE"));
    }

    @Test
    void anAdminRemovesAProductForGoodWithAReason() throws Exception {
        String vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
        JsonNode product = created(vendorId, productBody());
        String productId = product.get("id").asText();

        changeStatus(asOwner(vendorId, productId), "{\"status\":\"REMOVED\",\"removedReason\":\"x\"}")
                .andExpect(status().isForbidden());
        changeStatus(asAdmin(vendorId, productId), "{\"status\":\"REMOVED\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_029"));
        changeStatus(asAdmin(vendorId, productId), "{\"status\":\"REMOVED\",\"removedReason\":\"Hàng giả\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REMOVED"))
                .andExpect(jsonPath("$.data.removedReason").value("Hàng giả"));

        JsonNode tombstone = lastEnvelope(RabbitConfig.PRODUCT_REMOVED_ROUTING_KEY, productId);
        assertEquals("REMOVED", tombstone.get("data").get("status").asText());
        assertTrue(
                tombstone.get("sourceVersion").asLong() > product.get("version").asLong());

        replace(
                        vendorId,
                        productId,
                        productBody()
                                .put("version", tombstone.get("sourceVersion").asLong()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_026"));
        changeStatus(asOwner(vendorId, productId), "{\"status\":\"ON_SALE\"}")
                .andExpect(jsonPath("$.code").value("VENDOR_026"));
        mvc.perform(as(ownerId, Role.MEMBER, get("/api/vendors/{id}/products", vendorId)))
                .andExpect(jsonPath("$.data[*].status", contains("REMOVED")));
    }

    // ─── helpers ───

    private ObjectNode productBody() {
        ObjectNode body = objectMapper
                .createObjectNode()
                .put("name", "Hộp 4 bánh nướng")
                .put("description", "Bánh nướng nhân đậu xanh, hộp giấy")
                .put("listPrice", 100_000)
                .put("stock", 20)
                .put("expiryDate", EXPIRY_DATE.toString())
                .put("deliveryLabel", "LOCAL");
        body.set("imageKeys", objectMapper.valueToTree(List.of(TEMP_PREFIX + "a.jpg")));
        body.set("crustCodes", objectMapper.valueToTree(List.of("banh-nuong")));
        body.set("fillingCodes", objectMapper.valueToTree(List.of("dau-xanh")));
        body.set("priceTiers", objectMapper.valueToTree(List.of(Map.of("fromQty", 50, "unitPrice", 90_000))));
        return body;
    }

    private ResultActions create(String vendorId, JsonNode body) throws Exception {
        return mvc.perform(as(ownerId, Role.MEMBER, post("/api/vendors/{id}/products", vendorId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.toString()));
    }

    private JsonNode created(String vendorId, JsonNode body) throws Exception {
        String response = create(vendorId, body)
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("data");
    }

    private ResultActions replace(String vendorId, String productId, JsonNode body) throws Exception {
        return mvc.perform(as(ownerId, Role.MEMBER, put("/api/vendors/{id}/products/{pid}", vendorId, productId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.toString()));
    }

    private JsonNode replaced(String vendorId, String productId, JsonNode body) throws Exception {
        String response = replace(vendorId, productId, body)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("data");
    }

    private ResultActions changeStatus(MockHttpServletRequestBuilder request, String body) throws Exception {
        return mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private MockHttpServletRequestBuilder asOwner(String vendorId, String productId) {
        return as(ownerId, Role.MEMBER, patch("/api/vendors/{id}/products/{pid}", vendorId, productId));
    }

    private static MockHttpServletRequestBuilder asAdmin(String vendorId, String productId) {
        return as(ADMIN_ID, Role.ADMIN, patch("/api/vendors/{id}/products/{pid}", vendorId, productId));
    }

    private static MockHttpServletRequestBuilder as(
            String accountId, Role role, MockHttpServletRequestBuilder request) {
        return request.header(GatewayHeader.ACCOUNT_ID, accountId).header(GatewayHeader.USER_ROLE, role.name());
    }

    /** The last envelope of this product on {@code routingKey}. */
    private JsonNode lastEnvelope(String routingKey, String productId) throws Exception {
        List<String> payloads = jdbcTemplate.queryForList(
                "SELECT payload FROM outbox_events WHERE routing_key = ? AND payload LIKE ? ORDER BY created_at",
                String.class,
                routingKey,
                "%" + productId + "%");
        List<JsonNode> envelopes = new ArrayList<>();
        for (String payload : payloads) {
            envelopes.add(objectMapper.readTree(payload));
        }
        return envelopes.getLast();
    }
}
