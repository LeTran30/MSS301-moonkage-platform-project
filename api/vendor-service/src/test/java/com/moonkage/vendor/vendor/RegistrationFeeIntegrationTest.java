package com.moonkage.vendor.vendor;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.client.IdentityClient;
import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.client.dto.CreatePaymentRequest;
import com.moonkage.vendor.client.dto.CreatePaymentResponse;
import com.moonkage.vendor.client.dto.PaymentPurpose;
import com.moonkage.vendor.client.dto.PaymentSucceededEvent;
import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
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
 * Phase 2 end to end on PostgreSQL (FR-53, BR-31): the fee level, paying it through payment-service, recording
 * payment.succeeded once, the fee invoice. payment-service, the broker and MinIO are mocked; payment.succeeded is
 * handed to the listener directly, as the broker would.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class RegistrationFeeIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final long DEFAULT_FEE = 200_000;
    private static final String ADMIN_ID = "admin-1";
    private static final String TEMP_PREFIX = "tmp/vendor/";
    private static final Instant PAID_AT = Instant.parse("2026-10-26T03:00:00Z");

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
    private final VendorRepository vendorRepository;
    private final PaymentSucceededListener paymentSucceededListener;

    private String ownerId;

    @Autowired
    RegistrationFeeIntegrationTest(
            MockMvc mvc,
            JdbcTemplate jdbcTemplate,
            VendorRepository vendorRepository,
            PaymentSucceededListener paymentSucceededListener) {
        this.mvc = mvc;
        this.jdbcTemplate = jdbcTemplate;
        this.vendorRepository = vendorRepository;
        this.paymentSucceededListener = paymentSucceededListener;
    }

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID().toString();
        when(objectStorage.isTempKey(anyString()))
                .thenAnswer(call -> call.<String>getArgument(0).startsWith(TEMP_PREFIX));
        when(objectStorage.moveUploadedFile(anyString(), any(), any(), anyString()))
                .thenAnswer(call -> call.<String>getArgument(3) + "/" + UUID.randomUUID());
        when(paymentClient.createPayment(any()))
                .thenReturn(new CreatePaymentResponse("payment-1", "https://sandbox.vnpayment.vn/pay"));
    }

    /** Levels set by a test go away, so every test starts from the default level of the migration. */
    @AfterEach
    void removeChangedLevels() {
        jdbcTemplate.update("DELETE FROM registration_fee_configs WHERE created_by IS NOT NULL");
    }

    // ─── fee level ───

    @Test
    void aGuestReadsTheFeeLevelInEffect() throws Exception {
        mvc.perform(get("/api/registration-fee-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.amount").value(DEFAULT_FEE));
    }

    @Test
    void anAdminSetsANewLevelThatTakesEffectNow() throws Exception {
        changeFee(ADMIN_ID, Role.ADMIN, "{\"amount\":250000}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.amount").value(250_000));

        mvc.perform(get("/api/registration-fee-config"))
                .andExpect(jsonPath("$.data.amount").value(250_000));
        assertEquals(2, jdbcTemplate.queryForObject("SELECT count(*) FROM registration_fee_configs", Integer.class));
        assertEquals(
                1,
                jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM outbox_events WHERE routing_key = ? AND payload LIKE '%250000%'",
                        Integer.class, RabbitConfig.REGISTRATION_FEE_CHANGED_ROUTING_KEY));
    }

    @Test
    void aLevelMustBeMoreThanZero() throws Exception {
        changeFee(ADMIN_ID, Role.ADMIN, "{\"amount\":0}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400_PRICE"))
                .andExpect(jsonPath("$.errors[0].field").value("amount"));
    }

    @Test
    void aMemberCannotChangeTheLevel() throws Exception {
        changeFee(ownerId, Role.MEMBER, "{\"amount\":1}").andExpect(status().isForbidden());
    }

    // ─── paying ───

    @Test
    void theOwnerOfAnApprovedVendorPaysTheLevelInEffect() throws Exception {
        String vendorId = saveVendor(true);

        mvc.perform(asOwner(post("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.paymentId").value("payment-1"))
                .andExpect(jsonPath("$.data.amount").value(DEFAULT_FEE))
                .andExpect(jsonPath("$.data.paymentUrl").value("https://sandbox.vnpayment.vn/pay"));

        verify(paymentClient)
                .createPayment(
                        new CreatePaymentRequest(PaymentPurpose.REGISTRATION_FEE, vendorId, ownerId, DEFAULT_FEE));
    }

    @Test
    void aVendorNotApprovedCannotPay() throws Exception {
        String vendorId = saveVendor(false);

        mvc.perform(asOwner(post("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_012"));
        verify(paymentClient, never()).createPayment(any());
    }

    @Test
    void onlyTheOwnerPays() throws Exception {
        String vendorId = saveVendor(true);

        mvc.perform(as(ADMIN_ID, Role.ADMIN, post("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(status().isForbidden());
    }

    // ─── payment.succeeded ───

    @Test
    void aSucceededFeePaymentIsRecordedOnceAndTheVendorOperates() throws Exception {
        String vendorId = saveVendor(true);
        PaymentSucceededEvent event = paymentSucceeded(vendorId, "payment-1", PaymentPurpose.REGISTRATION_FEE);

        paymentSucceededListener.onPaymentSucceeded(event);
        paymentSucceededListener.onPaymentSucceeded(event);
        paymentSucceededListener.onPaymentSucceeded(
                paymentSucceeded(vendorId, "payment-2", PaymentPurpose.REGISTRATION_FEE));

        mvc.perform(asOwner(get("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].paymentId").value("payment-1"))
                .andExpect(jsonPath("$.data[0].amount").value(DEFAULT_FEE));
        mvc.perform(asOwner(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.canOperate").value(true));
        assertEquals(1, outboxCount(RabbitConfig.VENDOR_REGISTRATION_FEE_PAID_ROUTING_KEY, vendorId));
        mvc.perform(asOwner(post("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_013"));
    }

    @Test
    void aPaymentForAnotherPurposeIsIgnored() throws Exception {
        String vendorId = saveVendor(true);

        paymentSucceededListener.onPaymentSucceeded(paymentSucceeded(vendorId, "payment-1", PaymentPurpose.CHECKOUT));

        mvc.perform(asOwner(get("/api/vendors/{id}/registration-fee-payments", vendorId)))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    // ─── fee invoice ───

    @Test
    void theAdminAttachesTheFeeInvoiceOnceThePaymentIsRecorded() throws Exception {
        String vendorId = saveVendor(true);
        String invoice = "{\"kind\":\"FEE_INVOICE\",\"objectKey\":\"" + TEMP_PREFIX + "invoice\"}";

        attachDocument(vendorId, invoice)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_014"));

        paymentSucceededListener.onPaymentSucceeded(
                paymentSucceeded(vendorId, "payment-1", PaymentPurpose.REGISTRATION_FEE));
        attachDocument(vendorId, invoice)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.kind").value("FEE_INVOICE"));
        mvc.perform(asOwner(get("/api/vendors/{id}", vendorId)))
                .andExpect(jsonPath("$.data.documents[*].kind", hasItem("FEE_INVOICE")));
    }

    @Test
    void theAdminAttachesOnlyTheFeeInvoice() throws Exception {
        String vendorId = saveVendor(true);

        attachDocument(vendorId, "{\"kind\":\"FOOD_SAFETY\",\"objectKey\":\"" + TEMP_PREFIX + "x\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("kind"));
    }

    @Test
    void theOwnerDoesNotAttachTheFeeInvoice() throws Exception {
        String vendorId = saveVendor(true);

        mvc.perform(asOwner(post("/api/vendors/{id}/documents", vendorId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"FEE_INVOICE\",\"objectKey\":\"" + TEMP_PREFIX + "x\"}"))
                .andExpect(status().isForbidden());
    }

    // ─── helpers ───

    private String saveVendor(boolean approved) {
        Vendor vendor = Vendor.register(ownerId, VendorTestData.profile());
        if (approved) {
            vendor.decide(ReviewDecision.APPROVE, null);
        }
        return vendorRepository.saveAndFlush(vendor).getId();
    }

    private static PaymentSucceededEvent paymentSucceeded(String vendorId, String paymentId, PaymentPurpose purpose) {
        return new PaymentSucceededEvent(
                UUID.randomUUID().toString(), paymentId, purpose.name(), vendorId, DEFAULT_FEE, PAID_AT);
    }

    private ResultActions changeFee(String accountId, Role role, String body) throws Exception {
        return mvc.perform(as(accountId, role, put("/api/registration-fee-config"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions attachDocument(String vendorId, String body) throws Exception {
        return mvc.perform(as(ADMIN_ID, Role.ADMIN, post("/api/vendors/{id}/documents", vendorId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private int outboxCount(String routingKey, String vendorId) {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM outbox_events WHERE routing_key = ? AND payload LIKE ?",
                Integer.class,
                routingKey,
                "%" + vendorId + "%");
    }

    private MockHttpServletRequestBuilder asOwner(MockHttpServletRequestBuilder request) {
        return as(ownerId, Role.MEMBER, request);
    }

    private static MockHttpServletRequestBuilder as(
            String accountId, Role role, MockHttpServletRequestBuilder request) {
        return request.header(GatewayHeader.ACCOUNT_ID, accountId).header(GatewayHeader.USER_ROLE, role.name());
    }
}
