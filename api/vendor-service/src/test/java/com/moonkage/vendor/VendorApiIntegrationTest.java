package com.moonkage.vendor;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.dto.CheckIdNumberResponse;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import java.time.Instant;
import java.util.HashMap;
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
 * The real application over HTTP on PostgreSQL: caller from the gateway headers, ApiResponse on success and error,
 * internal API unwrapped. identity-service, the broker and MinIO are mocked. Skipped when Docker is not running.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class VendorApiIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String ADMIN_ID = "admin-1";
    private static final String ID_NUMBER = "079200001234";
    private static final String TEMP_PREFIX = "tmp/vendor/";
    private static final Instant NFC_VERIFIED_AT = Instant.parse("2026-10-20T03:00:00Z");

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @MockitoBean
    private ObjectStorage objectStorage;

    @MockitoBean
    private IdentityClient identityClient;

    private final MockMvc mvc;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    /** A fresh account per test, so tests never share a vendor. */
    private String accountId;

    @Autowired
    VendorApiIntegrationTest(MockMvc mvc, ObjectMapper objectMapper, JdbcTemplate jdbcTemplate) {
        this.mvc = mvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID().toString();
        when(objectStorage.isTempKey(anyString()))
                .thenAnswer(call -> call.<String>getArgument(0).startsWith(TEMP_PREFIX));
        when(objectStorage.moveUploadedFile(anyString(), any(), any(), anyString()))
                .thenAnswer(call -> call.<String>getArgument(3) + "/" + UUID.randomUUID());
        when(objectStorage.createPresignedDownloadUrl(anyString()))
                .thenAnswer(call -> "https://minio.test/" + call.getArgument(0));
        ownerCardIs("PHẠM VĂN BÁNH", true);
    }

    // ─── upload link ───

    @Test
    void aMemberGetsAPresignedUploadLinkForADocument() throws Exception {
        when(objectStorage.createPresignedUploadLink(eq("application/pdf"), eq(1000L), any()))
                .thenReturn(new PresignedUploadLink(
                        TEMP_PREFIX + "1", "https://minio.test/upload", Map.of("key", "k"), NFC_VERIFIED_AT));

        mvc.perform(asMember(post("/api/vendors/uploads"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contentType\":\"application/pdf\",\"sizeBytes\":1000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tempKey").value(TEMP_PREFIX + "1"))
                .andExpect(jsonPath("$.data.formFields.key").value("k"));
    }

    @Test
    void anUploadLinkNeedsAContentTypeAndAPositiveSize() throws Exception {
        mvc.perform(asMember(post("/api/vendors/uploads"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contentType\":\"application/pdf\",\"sizeBytes\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("sizeBytes"));
    }

    // ─── submit ───

    @Test
    void aVerifiedOwnerSubmitsAPendingProfileAndTheAdminsAreTold() throws Exception {
        JsonNode vendor = submit(submission())
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString()
                .transform(this::readData);

        String vendorId = vendor.get("id").asText();
        assertEquals("PENDING", vendor.get("status").asText());
        assertEquals(accountId, vendor.get("ownerAccountId").asText());
        assertEquals("******6789", vendor.at("/bankAccount/maskedNumber").asText());
        assertEquals(2, vendor.get("documents").size());
        assertEquals(1, outboxCount(RabbitConfig.VENDOR_SUBMITTED_ROUTING_KEY, vendorId));
        String storedNumber = jdbcTemplate.queryForObject(
                "SELECT encode(bank_account_number_enc, 'escape') FROM vendors WHERE id = ?", String.class, vendorId);
        assertFalse(storedNumber.contains("0123456789"));

        mvc.perform(asAdmin(get("/api/vendors/{id}/owner-checks", vendorId)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].submissionNo").value(1))
                .andExpect(jsonPath("$.data[0].nameMatch").value("MATCH"))
                .andExpect(jsonPath("$.data[0].ownerLegalName").value("PHẠM VĂN BÁNH"));
    }

    @Test
    void aNameDifferentFromTheCardIsSubmittedWithAWarningForTheAdmin() throws Exception {
        ownerCardIs("TRẦN THỊ BÁNH", true);
        String vendorId = submitAndGetId();

        mvc.perform(asAdmin(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.ownerCheck.nameMatch").value("MISMATCH"));
    }

    @Test
    void theOwnerDoesNotSeeTheOwnerCheck() throws Exception {
        String vendorId = submitAndGetId();

        mvc.perform(asMember(get("/api/vendors/{id}", vendorId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ownerCheck").value(nullValue()));
    }

    @Test
    void anAccountWithoutNfcVerificationCannotSubmit() throws Exception {
        when(identityClient.checkIdNumber(any(), any()))
                .thenReturn(new CheckIdNumberResponse("h", 1, "********1234", false, null, null, null, false));

        submit(submission())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("VENDOR_003"));
        verify(objectStorage, never()).moveUploadedFile(anyString(), any(), any(), anyString());
    }

    @Test
    void anotherPersonsIdNumberIsRefusedAtItsField() throws Exception {
        ownerCardIs("PHẠM VĂN BÁNH", false);

        submit(submission())
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VENDOR_004"))
                .andExpect(jsonPath("$.errors[0].field").value("representativeIdNumber"));
    }

    @Test
    void aRepresentativeNameWithDiacriticsIsRefusedAtItsField() throws Exception {
        Map<String, Object> body = submission();
        body.put("representativeName", "Phạm Văn Bánh");

        submit(body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_102"))
                .andExpect(jsonPath("$.errors[0].field").value("representativeName"))
                .andExpect(jsonPath("$.errors[0].message").value(containsString("100")));
    }

    @Test
    void aCompanyIsNotAcceptedThroughTheSystem() throws Exception {
        Map<String, Object> body = submission();
        body.put("entityType", "COMPANY");

        submit(body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_005"))
                .andExpect(jsonPath("$.errors[0].field").value("entityType"));
    }

    @Test
    void theFoodSafetyPapersAreRequired() throws Exception {
        Map<String, Object> body = submission();
        body.put("documents", List.of(document("BUSINESS_LICENSE", TEMP_PREFIX + "license")));

        submit(body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_006"))
                .andExpect(jsonPath("$.message").value(containsString("FOOD_SAFETY")));
    }

    @Test
    void aMissingFieldIsAValidationErrorAtThatField() throws Exception {
        Map<String, Object> body = submission();
        body.remove("businessName");

        submit(body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("businessName"));
    }

    @Test
    void anAccountSubmitsOnlyOneProfile() throws Exception {
        submitAndGetId();

        submit(submission())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_002"));
    }

    // ─── review ───

    @Test
    void anApprovalNeedsTheLicenceAndRegistryConfirmations() throws Exception {
        String vendorId = submitAndGetId();

        review(vendorId, Map.of("decision", "APPROVE", "licenseChecked", true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_011"))
                .andExpect(jsonPath("$.message").value(containsString("registryChecked")));

        review(vendorId, Map.of("decision", "APPROVE", "licenseChecked", true, "registryChecked", true))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.decision").value("APPROVE"));
        mvc.perform(asMember(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.canOperate").value(false));
        assertEquals(1, outboxCount(RabbitConfig.VENDOR_REVIEWED_ROUTING_KEY, vendorId));
    }

    @Test
    void aRefusalNeedsAReason() throws Exception {
        String vendorId = submitAndGetId();

        review(vendorId, Map.of("decision", "REJECT", "reason", "  "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_010"))
                .andExpect(jsonPath("$.errors[0].field").value("reason"));
    }

    @Test
    void onlyAPendingProfileIsReviewed() throws Exception {
        String vendorId = submitAndGetId();
        review(vendorId, Map.of("decision", "REJECT", "reason", "Sai mã số thuế"))
                .andExpect(status().isCreated());

        review(vendorId, Map.of("decision", "REJECT", "reason", "Lần nữa"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMON_409"));
    }

    @Test
    void aMemberCannotReview() throws Exception {
        String vendorId = submitAndGetId();

        mvc.perform(asMember(post("/api/vendors/{id}/reviews", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVE\",\"licenseChecked\":true,\"registryChecked\":true}"))
                .andExpect(status().isForbidden());
    }

    // ─── resubmit ───

    @Test
    void afterNeedsInfoTheOwnerResubmitsKeepingTheDocumentsNotReplaced() throws Exception {
        String vendorId = submitAndGetId();
        review(vendorId, Map.of("decision", "NEEDS_INFO", "reason", "Giấy ATTP mờ"))
                .andExpect(status().isCreated());
        mvc.perform(asMember(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.status").value("NEEDS_INFO"))
                .andExpect(jsonPath("$.data.statusReason").value("Giấy ATTP mờ"));
        String licenseKey = jdbcTemplate.queryForObject(
                "SELECT object_key FROM vendor_documents WHERE vendor_id = ? AND kind = 'BUSINESS_LICENSE'",
                String.class,
                vendorId);

        Map<String, Object> body = submission();
        body.put(
                "documents",
                List.of(
                        document("BUSINESS_LICENSE", licenseKey),
                        document("FOOD_SAFETY", TEMP_PREFIX + "food-safety-2")));
        mvc.perform(asMember(put("/api/vendors/{id}", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.statusReason").value(nullValue()))
                .andExpect(jsonPath("$.data.documents", hasSize(2)));

        assertEquals(
                3,
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM vendor_documents WHERE vendor_id = ?", Integer.class, vendorId));
        mvc.perform(asAdmin(get("/api/vendors/{id}/owner-checks", vendorId)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[1].submissionNo").value(2));
    }

    @Test
    void aPendingProfileCannotBeResubmitted() throws Exception {
        String vendorId = submitAndGetId();

        mvc.perform(asMember(put("/api/vendors/{id}", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submission())))
                .andExpect(status().isConflict());
    }

    // ─── access ───

    @Test
    void anotherMemberCannotSeeTheVendorOrItsDocuments() throws Exception {
        String vendorId = submitAndGetId();
        String documentId = jdbcTemplate.queryForObject(
                "SELECT id FROM vendor_documents WHERE vendor_id = ? LIMIT 1", String.class, vendorId);

        mvc.perform(as("someone-else", Role.MEMBER, get("/api/vendors/{id}", vendorId)))
                .andExpect(status().isForbidden());
        mvc.perform(as("someone-else", Role.MEMBER, get("/api/vendors/{id}/documents/{d}", vendorId, documentId)))
                .andExpect(status().isForbidden());
        mvc.perform(as("someone-else", Role.MEMBER, get("/api/vendors").param("ownerAccountId", accountId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void theOwnerOpensADocumentThroughAShortLivedLink() throws Exception {
        String vendorId = submitAndGetId();
        String documentId = jdbcTemplate.queryForObject(
                "SELECT id FROM vendor_documents WHERE vendor_id = ? LIMIT 1", String.class, vendorId);

        mvc.perform(asMember(get("/api/vendors/{id}/documents/{d}", vendorId, documentId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("vendor/" + vendorId)))
                .andExpect(jsonPath("$.data.expiresAt").value(notNullValue()));
    }

    @Test
    void aMemberFindsTheirOwnVendorWithMe() throws Exception {
        String vendorId = submitAndGetId();

        mvc.perform(asMember(get("/api/vendors").param("ownerAccountId", "me")))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(vendorId));
        mvc.perform(get("/internal/vendors/by-owner/{accountId}", accountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vendorId))
                .andExpect(jsonPath("$.canOperate").value(false))
                // nothing private crosses to other services (NFR-03)
                .andExpect(jsonPath("$.bankAccount").doesNotExist())
                .andExpect(jsonPath("$.bankAccountMasked").doesNotExist());
    }

    // ─── framework behaviour ───

    @Test
    void anErrorAnswersInTheApiResponseShape() throws Exception {
        mvc.perform(asMember(patch("/api/vendors/{id}", "missing"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"localDeliveryFee\":0}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("VENDOR_001"))
                .andExpect(jsonPath("$.message").value(notNullValue()))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    @Test
    void aRequestWithoutGatewayHeadersIsUnauthenticated() throws Exception {
        mvc.perform(post("/api/vendors/uploads"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("COMMON_401"));
    }

    @Test
    void anUnknownRoleIsUnauthenticated() throws Exception {
        mvc.perform(as(accountId, null, post("/api/vendors/uploads")).header(GatewayHeader.USER_ROLE, "ROOT"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("COMMON_401"));
    }

    @Test
    void anUnknownStatusFilterIsABadRequest() throws Exception {
        mvc.perform(asAdmin(get("/api/vendors")).param("status", "SLEEPING"))
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
    void swaggerDescribesEndpointsFromTheirJavadoc() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/vendors/{vendorId}/products'].post.description")
                        .value(org.hamcrest.Matchers.containsString("on sale at once")));
    }

    @Test
    void theInternalLookupOfAnAccountWithoutVendorIsAnEmptyNotFound() throws Exception {
        mvc.perform(get("/internal/vendors/by-owner/{accountId}", "nobody"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));
    }

    // ─── helpers ───

    private void ownerCardIs(String legalName, boolean matchesAccount) {
        when(identityClient.checkIdNumber(any(), any()))
                .thenReturn(new CheckIdNumberResponse(
                        "a".repeat(64), 1, "********1234", matchesAccount, legalName, "********1234", null, true));
    }

    private static Map<String, Object> submission() {
        Map<String, Object> body = new HashMap<>();
        body.put("businessName", "Tiệm bánh Trăng");
        body.put("entityType", "SOLE_PROPRIETORSHIP");
        body.put("taxCode", "0312345678");
        body.put("address", "12 Lê Lợi, Bến Thành");
        body.put("provinceCode", "79");
        body.put("representativeName", "pham van banh");
        body.put("representativeIdNumber", ID_NUMBER);
        body.put("supplySource", "SELF_PRODUCED");
        body.put("sellsShop", true);
        body.put("acceptsOrders", false);
        body.put("bankName", "Vietcombank");
        body.put("bankAccountNumber", "0123 456 789");
        body.put("bankAccountHolder", "PHAM VAN BANH");
        body.put(
                "documents",
                List.of(
                        document("BUSINESS_LICENSE", TEMP_PREFIX + "license"),
                        document("FOOD_SAFETY", TEMP_PREFIX + "food-safety")));
        return body;
    }

    private static Map<String, String> document(String kind, String objectKey) {
        return Map.of("kind", kind, "objectKey", objectKey);
    }

    private ResultActions submit(Map<String, Object> body) throws Exception {
        return mvc.perform(asMember(post("/api/vendors"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private String submitAndGetId() throws Exception {
        String json = submit(submission())
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readData(json).get("id").asText();
    }

    private ResultActions review(String vendorId, Map<String, Object> body) throws Exception {
        return mvc.perform(asAdmin(post("/api/vendors/{id}/reviews", vendorId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private int outboxCount(String routingKey, String vendorId) {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM outbox_events WHERE routing_key = ? AND payload LIKE ?",
                Integer.class,
                routingKey,
                "%" + vendorId + "%");
    }

    private JsonNode readData(String json) {
        try {
            return objectMapper.readTree(json).get("data");
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private MockHttpServletRequestBuilder asMember(MockHttpServletRequestBuilder request) {
        return as(accountId, Role.MEMBER, request);
    }

    private static MockHttpServletRequestBuilder asAdmin(MockHttpServletRequestBuilder request) {
        return as(ADMIN_ID, Role.ADMIN, request);
    }

    private static MockHttpServletRequestBuilder as(
            String accountId, Role role, MockHttpServletRequestBuilder request) {
        request.header(GatewayHeader.ACCOUNT_ID, accountId);
        return role == null ? request : request.header(GatewayHeader.USER_ROLE, role.name());
    }
}
