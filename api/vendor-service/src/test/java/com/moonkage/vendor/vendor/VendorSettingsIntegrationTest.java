package com.moonkage.vendor.vendor;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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

/**
 * Phase 3 end to end on PostgreSQL: delivery fee and areas (FR-28), order profile (FR-35), lock (FR-46), and the
 * vendor snapshot each change announces (vendor.updated / vendor.locked). The broker, MinIO, identity and payment
 * are mocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class VendorSettingsIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String ADMIN_ID = "admin-1";
    private static final String ONE_TIER = "[{\"fromQty\":50,\"unitPrice\":90000}]";

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
    private final VendorRepository vendorRepository;

    private String ownerId;

    @Autowired
    VendorSettingsIntegrationTest(
            MockMvc mvc, ObjectMapper objectMapper, JdbcTemplate jdbcTemplate, VendorRepository vendorRepository) {
        this.mvc = mvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.vendorRepository = vendorRepository;
    }

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID().toString();
    }

    // ─── delivery fee (FR-28, AC-28.3) ───

    @Test
    void theOwnerSetsTheDeliveryFeeAndTheSnapshotCarriesIt() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        patchVendor(asOwner(vendorId), "{\"localDeliveryFee\":15000}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.localDeliveryFee").value(15_000));

        JsonNode snapshot = lastSnapshot(RabbitConfig.VENDOR_UPDATED_ROUTING_KEY, vendorId);
        assertEquals(15_000, snapshot.get("localDeliveryFee").asLong());
        assertEquals(ownerId, snapshot.get("changedBy").asText());
    }

    @Test
    void aNegativeFeeIsRefusedAtItsField() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        patchVendor(asOwner(vendorId), "{\"localDeliveryFee\":-1}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_105"))
                .andExpect(jsonPath("$.errors[0].field").value("localDeliveryFee"));
    }

    @Test
    void theOwnerCannotLockAndTheAdminCannotSetTheFee() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        patchVendor(asOwner(vendorId), "{\"status\":\"LOCKED\",\"statusReason\":\"x\"}")
                .andExpect(status().isForbidden());
        patchVendor(asAdmin(vendorId), "{\"localDeliveryFee\":0}").andExpect(status().isForbidden());
    }

    @Test
    void aVendorNotYetApprovedHasNoSellingSettings() throws Exception {
        String vendorId = vendorRepository
                .saveAndFlush(Vendor.register(ownerId, VendorTestData.profile()))
                .getId();

        patchVendor(asOwner(vendorId), "{\"localDeliveryFee\":0}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_012"));
    }

    // ─── delivery areas (FR-28, AC-28.1) ───

    @Test
    void theOwnerReplacesTheDeliveryAreasAndEachChangeGetsANewVersion() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        saveAreas(vendorId, "[\"79\",\"01\",\"79\"]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", contains("01", "79")));
        saveAreas(vendorId, "[\"01\",\"48\"]").andExpect(jsonPath("$.data", contains("01", "48")));

        mvc.perform(asOwner(get("/api/vendors/{id}/delivery-areas", vendorId)))
                .andExpect(jsonPath("$.data", contains("01", "48")));
        mvc.perform(asOwner(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.deliveryAreas", contains("01", "48")));
        List<JsonNode> snapshots = snapshots(RabbitConfig.VENDOR_UPDATED_ROUTING_KEY, vendorId);
        assertEquals(2, snapshots.size());
        assertTrue(snapshots.get(1).get("sourceVersion").asLong()
                > snapshots.get(0).get("sourceVersion").asLong());
        assertEquals("48", snapshots.get(1).get("deliveryAreas").get(1).asText());
    }

    @Test
    void anUnknownProvinceOrNoProvinceIsRefused() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        saveAreas(vendorId, "[\"01\",\"99\"]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400_PROVINCE"))
                .andExpect(jsonPath("$.errors[0].field").value("provinceCodes"));
        saveAreas(vendorId, "[]").andExpect(jsonPath("$.code").value("VENDOR_106"));
    }

    @Test
    void anotherMemberCannotChangeTheAreas() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        mvc.perform(as("someone-else", Role.MEMBER, put("/api/vendors/{id}/delivery-areas", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provinceCodes\":[\"01\"]}"))
                .andExpect(status().isForbidden());
    }

    // ─── order profile (FR-35) ───

    @Test
    void aVendorThatDoesNotAcceptOrdersHasNoOrderProfile() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        saveOrderProfile(vendorId, producerProfile("[{\"fromQty\":50,\"unitPrice\":90000}]"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_015"));
    }

    @Test
    void aProducerMustGiveItsWeeklyCapacity() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));

        saveOrderProfile(
                        vendorId,
                        "{\"minQty\":50,\"leadTimeDays\":7,\"priceTiers\":[{\"fromQty\":50,\"unitPrice\":90000}],"
                                + "\"packagingTypes\":\"Hộp giấy\",\"logoPrinting\":true}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_017"))
                .andExpect(jsonPath("$.errors[0].field").value("weeklyCapacity"));
    }

    @Test
    void theOwnerReplacesTheOrderProfileAndQuotationGetsItInTheSnapshot() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));
        mvc.perform(asOwner(get("/api/vendors/{id}/order-profile", vendorId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VENDOR_016"));

        saveOrderProfile(
                        vendorId,
                        producerProfile("[{\"fromQty\":100,\"unitPrice\":85000},{\"fromQty\":50,\"unitPrice\":90000}]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.priceTiers[0].fromQty").value(50));
        // the tier at 50 stays with a new price, the one at 100 goes, one at 200 comes
        saveOrderProfile(
                        vendorId,
                        producerProfile("[{\"fromQty\":50,\"unitPrice\":88000},{\"fromQty\":200,\"unitPrice\":80000}]"))
                .andExpect(status().isOk());

        mvc.perform(asOwner(get("/api/vendors/{id}/order-profile", vendorId)))
                .andExpect(jsonPath("$.data.priceTiers", hasSize(2)))
                .andExpect(jsonPath("$.data.priceTiers[0].unitPrice").value(88_000))
                .andExpect(jsonPath("$.data.priceTiers[1].fromQty").value(200))
                .andExpect(jsonPath("$.data.customTypes", contains("BAG")));
        JsonNode profile =
                lastSnapshot(RabbitConfig.VENDOR_UPDATED_ROUTING_KEY, vendorId).get("orderProfile");
        assertEquals(50, profile.get("minQty").asInt());
        assertEquals(200, profile.get("priceTiers").get(1).get("fromQty").asInt());
        // fillings in the admin's order of the catalogue, not the order sent
        assertEquals("banh-nuong", profile.get("crustCodes").get(0).asText());
        assertEquals("thap-cam", profile.get("fillingCodes").get(0).asText());
        assertEquals("dau-xanh", profile.get("fillingCodes").get(1).asText());
    }

    @Test
    void aProducerChoosesItsCrustsAndFillingsInTheCatalogue() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));

        saveOrderProfile(vendorId, producerProfile(ONE_TIER, "[]", "[\"dau-xanh\"]", "Hộp giấy"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_017"))
                .andExpect(jsonPath("$.errors[0].field").value("crustCodes"));
        saveOrderProfile(vendorId, producerProfile(ONE_TIER, "[\"banh-nuong\"]", "[\"banh-gio\"]", "Hộp giấy"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_022"))
                .andExpect(jsonPath("$.errors[0].field").value("fillingCodes"));
        // a crust code in the filling list is not a filling
        saveOrderProfile(vendorId, producerProfile(ONE_TIER, "[\"banh-nuong\"]", "[\"banh-deo\"]", "Hộp giấy"))
                .andExpect(jsonPath("$.code").value("VENDOR_022"));
    }

    @Test
    void aHiddenCrustStaysOnTheProfileThatHadItButIsNotAddedAnew() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));
        String body = producerProfile(ONE_TIER, "[\"banh-deo\"]", "[\"dau-xanh\"]", "Hộp giấy");
        saveOrderProfile(vendorId, body).andExpect(status().isOk());

        jdbcTemplate.update("UPDATE cake_attributes SET active = false WHERE code = 'banh-deo'");
        try {
            saveOrderProfile(vendorId, body)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.crustCodes", contains("banh-deo")));

            ownerId = UUID.randomUUID().toString();
            String otherId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));
            saveOrderProfile(otherId, body)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VENDOR_022"))
                    .andExpect(jsonPath("$.errors[0].field").value("crustCodes"));
        } finally {
            jdbcTemplate.update("UPDATE cake_attributes SET active = true WHERE code = 'banh-deo'");
        }
    }

    @Test
    void aTooLongPackagingIsRefusedAtItsField() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));

        saveOrderProfile(
                        vendorId,
                        producerProfile(
                                ONE_TIER,
                                "[\"banh-nuong\"]",
                                "[\"dau-xanh\"]",
                                "x".repeat(VendorConstant.TEXT_MAX_LENGTH + 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("packagingTypes"));
    }

    @Test
    void twoTiersCannotStartAtTheSameQuantity() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile(SupplySource.SELF_PRODUCED, false, true));

        saveOrderProfile(
                        vendorId,
                        producerProfile("[{\"fromQty\":50,\"unitPrice\":90000},{\"fromQty\":50,\"unitPrice\":1}]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400_PRICE_TIERS"))
                .andExpect(jsonPath("$.errors[0].field").value("priceTiers"));
    }

    // ─── lock (FR-46, BR-20) ───

    @Test
    void theAdminLocksWithAReasonAndCopiesHearItOnce() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        patchVendor(asAdmin(vendorId), "{\"status\":\"LOCKED\",\"statusReason\":\" Bán hàng giả \"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("LOCKED"))
                .andExpect(jsonPath("$.data.statusReason").value("Bán hàng giả"))
                .andExpect(jsonPath("$.data.canOperate").value(false));

        assertEquals(
                0, snapshots(RabbitConfig.VENDOR_UPDATED_ROUTING_KEY, vendorId).size());
        JsonNode locked = lastSnapshot(RabbitConfig.VENDOR_LOCKED_ROUTING_KEY, vendorId);
        assertEquals("LOCKED", locked.get("status").asText());
        assertEquals(ADMIN_ID, locked.get("changedBy").asText());
        assertFalse(locked.get("canOperate").asBoolean());
        patchVendor(asOwner(vendorId), "{\"localDeliveryFee\":0}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_012"));
    }

    @Test
    void aLockNeedsAReasonAndOnlyLockedIsAccepted() throws Exception {
        String vendorId = saveApproved(VendorTestData.profile());

        patchVendor(asAdmin(vendorId), "{\"status\":\"LOCKED\",\"statusReason\":\" \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_018"))
                .andExpect(jsonPath("$.errors[0].field").value("statusReason"));
        patchVendor(asAdmin(vendorId), "{\"status\":\"APPROVED\",\"statusReason\":\"x\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("status"));
    }

    // ─── helpers ───

    /** Approved directly in the database: the review flow is covered by VendorApiIntegrationTest. */
    private String saveApproved(VendorProfile profile) {
        Vendor vendor = Vendor.register(ownerId, profile);
        vendor.decide(ReviewDecision.APPROVE, null);
        return vendorRepository.saveAndFlush(vendor).getId();
    }

    private static String producerProfile(String priceTiers) {
        return producerProfile(priceTiers, "[\"banh-nuong\"]", "[\"dau-xanh\",\"thap-cam\"]", "Hộp giấy");
    }

    private static String producerProfile(
            String priceTiers, String crustCodes, String fillingCodes, String packagingTypes) {
        return "{\"minQty\":50,\"leadTimeDays\":7,\"priceTiers\":" + priceTiers + ",\"customTypes\":[\"BAG\"],"
                + "\"weeklyCapacity\":500,\"crustCodes\":" + crustCodes + ",\"fillingCodes\":" + fillingCodes
                + ",\"packagingTypes\":\"" + packagingTypes + "\",\"logoPrinting\":true}";
    }

    private ResultActions patchVendor(MockHttpServletRequestBuilder request, String body) throws Exception {
        return mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions saveAreas(String vendorId, String codes) throws Exception {
        return mvc.perform(asOwner(put("/api/vendors/{id}/delivery-areas", vendorId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"provinceCodes\":" + codes + "}"));
    }

    private ResultActions saveOrderProfile(String vendorId, String body) throws Exception {
        return mvc.perform(asOwner(put("/api/vendors/{id}/order-profile", vendorId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    /** Snapshots this vendor announced on {@code routingKey}, oldest first. */
    private List<JsonNode> snapshots(String routingKey, String vendorId) throws Exception {
        List<String> payloads = jdbcTemplate.queryForList(
                "SELECT payload FROM outbox_events WHERE routing_key = ? AND payload LIKE ? ORDER BY created_at",
                String.class,
                routingKey,
                "%" + vendorId + "%");
        List<JsonNode> snapshots = new ArrayList<>();
        for (String payload : payloads) {
            snapshots.add(objectMapper.readTree(payload));
        }
        return snapshots;
    }

    private JsonNode lastSnapshot(String routingKey, String vendorId) throws Exception {
        return snapshots(routingKey, vendorId).getLast();
    }

    private MockHttpServletRequestBuilder asOwner(String vendorId) {
        return as(ownerId, Role.MEMBER, patch("/api/vendors/{id}", vendorId));
    }

    private static MockHttpServletRequestBuilder asAdmin(String vendorId) {
        return as(ADMIN_ID, Role.ADMIN, patch("/api/vendors/{id}", vendorId));
    }

    private MockHttpServletRequestBuilder asOwner(MockHttpServletRequestBuilder request) {
        return as(ownerId, Role.MEMBER, request);
    }

    private static MockHttpServletRequestBuilder as(
            String accountId, Role role, MockHttpServletRequestBuilder request) {
        return request.header(GatewayHeader.ACCOUNT_ID, accountId).header(GatewayHeader.USER_ROLE, role.name());
    }
}
