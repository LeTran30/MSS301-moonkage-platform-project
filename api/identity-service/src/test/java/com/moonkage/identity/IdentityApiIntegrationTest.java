package com.moonkage.identity;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.moonkage.identity.config.RabbitConfig;
import com.moonkage.identity.messaging.EmailNotificationEvent;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * The real application over HTTP (security filter chain, validation, error
 * shape, JPA on PostgreSQL). Only the
 * broker is mocked: it also hands the test the OTP that would have been
 * emailed. Skipped when Docker is not running.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class IdentityApiIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String PASSWORD = "Secret@123";
    private static final AtomicInteger SEQ = new AtomicInteger();

    private final MockMvc mvc;

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    /** A throw-away transport key, so a submitted card reaches the database step instead of a missing-key 500. */
    @DynamicPropertySource
    static void nfcTransportKey(DynamicPropertyRegistry registry) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        String privateKey = Base64.getEncoder()
                .encodeToString(generator.generateKeyPair().getPrivate().getEncoded());
        registry.add("nfc.transport-private-key", () -> privateKey);
    }

    @Autowired
    IdentityApiIntegrationTest(MockMvc mvc) {
        this.mvc = mvc;
    }

    // ───────── FR-01, FR-02 ─────────

    @Test
    void registerVerifyLoginWithAnyPhoneFormatThenMe() throws Exception {
        int n = SEQ.incrementAndGet();
        String email = "lan" + n + "@x.vn";
        String phoneDigits = String.format("9120000%02d", n);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","phoneNumber":"+84%s","fullName":"Nguyen Lan","password":"%s"}
                                """.formatted(email, phoneDigits, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("OK"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.data.verified").value(false))
                .andExpect(jsonPath("$.data.status").doesNotExist())
                .andExpect(jsonPath("$.data.otpSent").value(true));

        // not confirmed yet: told so only because the password is right (FR-02)
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(email, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_002"));

        mvc.perform(post("/api/auth/verify-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                                {"email":"%s","otp":"%s"}
                                                """.formatted(email, lastOtp(email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true));

        // registered as +84…, logs in as 0…: one stored form (AC-01.3)
        String token = token(login("0" + phoneDigits, PASSWORD));

        mvc.perform(get("/api/accounts/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.phoneNumber").value(phoneDigits))
                .andExpect(jsonPath("$.data.role").value("MEMBER"));
    }

    @Test
    void invalidRequestReturnsTheAgreedErrorShape() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                                {"email":"not-an-email","fullName":"Lan","password":"short"}
                                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("COMMON_400"))
                .andExpect(jsonPath("$.message").value("Dữ liệu đầu vào không hợp lệ."))
                .andExpect(jsonPath("$.data").value(nullValue()))
                .andExpect(jsonPath("$.path").value("/api/auth/register"))
                .andExpect(jsonPath("$.timestamp").exists())
                // Q-08: message from messages.properties with {min} / {max} filled
                .andExpect(jsonPath("$.errors[*].message", hasItem("Mật khẩu từ 8 đến 72 ký tự")));
    }

    @Test
    void sameEmailCannotRegisterTwice() throws Exception {
        String email = "dup" + SEQ.incrementAndGet() + "@x.vn";
        register(email);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_007"));
    }

    @Test
    void protectedEndpointWithoutTokenIs401WithPath() throws Exception {
        mvc.perform(get("/api/addresses"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_010"))
                .andExpect(jsonPath("$.path").value("/api/addresses"));
    }

    // ───────── Q-04, Q-05 ─────────

    @Test
    void passwordResetEndsEveryOtherSession() throws Exception {
        String email = activeAccount();
        String oldLogin = login(email, PASSWORD);
        // JWT iat has whole seconds: the reset must happen in a later second than the
        // old login
        Thread.sleep(1100);

        mvc.perform(post("/api/auth/send-reset-password-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(email)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                                {"email":"%s","otp":"%s","newPassword":"NewSecret@123"}
                                                """.formatted(email, lastOtp(email))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/accounts/me").header("Authorization", "Bearer " + token(oldLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_012"));
        mvc.perform(post("/api/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken(oldLogin))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_006"));
        token(login(email, "NewSecret@123"));
    }

    @Test
    void registrationCodeCannotResetThePassword() throws Exception {
        String email = "q05-" + SEQ.incrementAndGet() + "@x.vn";
        register(email);

        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                                {"email":"%s","otp":"%s","newPassword":"NewSecret@123"}
                                                """.formatted(email, lastOtp(email))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_005"));
    }

    // ───────── FR-03, FR-04 ─────────

    @Test
    void addressTimestampsCarryATimeZone() throws Exception {
        String token = token(login(activeAccount(), PASSWORD));

        mvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"detail\":\"12 Le Loi, Q1\",\"areaCode\":\"hcm\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.areaCode").value("HCM"))
                .andExpect(jsonPath("$.data.isDefault").value(true))
                .andExpect(jsonPath("$.data.createdAt", endsWith("Z")));
    }

    @Test
    void nfcSessionBelongsToItsAccount() throws Exception {
        String owner = token(login(activeAccount(), PASSWORD));
        String stranger = token(login(activeAccount(), PASSWORD));

        String created = mvc.perform(post("/api/nfc/sessions").header("Authorization", "Bearer " + owner))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String sessionId = JsonPath.read(created, "$.data.sessionId");

        mvc.perform(get("/api/nfc/sessions/" + sessionId).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
        mvc.perform(get("/api/nfc/sessions/" + sessionId).header("Authorization", "Bearer " + stranger))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NFC_004"));
    }

    @Test
    void nfcStatusOfOwnAccountStartsNotVerified() throws Exception {
        String owner = token(login(activeAccount(), PASSWORD));

        mvc.perform(get("/api/nfc/status").header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nfcStatus").value("NOT_VERIFIED"));
        mvc.perform(get("/api/nfc/status")).andExpect(status().isUnauthorized());
    }

    @Test
    void internalNfcStatusAnswersForAnyAccountUnwrapped() throws Exception {
        String accountId = JsonPath.read(login(activeAccount(), PASSWORD), "$.data.accountId");

        // other services get the bare body, not ApiResponse (Software Design 5.1 rule 8)
        mvc.perform(get("/internal/nfc/status/" + accountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nfcStatus").value("NOT_VERIFIED"));
        mvc.perform(get("/internal/nfc/status/unknown-account")).andExpect(status().isNotFound());
    }

    @Test
    void rejectedCardCountsTheAttemptInItsOwnTransaction() throws Exception {
        String owner = token(login(activeAccount(), PASSWORD));
        String created = mvc.perform(post("/api/nfc/sessions").header("Authorization", "Bearer " + owner))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String sessionId = JsonPath.read(created, "$.data.sessionId");
        String card = "{\"fullName\":\"NGUYEN VAN A\",\"encryptedFields\":\"not-a-jwe\"}";

        // row lock and outbox both need the transaction; the second answer proves the first attempt was committed
        for (int attemptsLeft : new int[] {4, 3}) {
            mvc.perform(post("/api/nfc/sessions/" + sessionId + "/card")
                            .header("Authorization", "Bearer " + owner)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(card))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.reasonCode").value("BAD_FORMAT"))
                    .andExpect(jsonPath("$.data.attemptsLeft").value(attemptsLeft));
        }
    }

    // ───────── helpers ─────────

    /** Registered, e-mail confirmed, ready to log in with PASSWORD. */
    private String activeAccount() throws Exception {
        String email = "user" + SEQ.incrementAndGet() + "@x.vn";
        register(email);
        mvc.perform(post("/api/auth/verify-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"otp\":\"%s\"}".formatted(email, lastOtp(email))))
                .andExpect(status().isOk());
        return email;
    }

    private void register(String email) throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(email)))
                .andExpect(status().isOk());
    }

    private static String registerBody(String email) {
        return "{\"email\":\"%s\",\"fullName\":\"Test User\",\"password\":\"%s\"}".formatted(email, PASSWORD);
    }

    private String login(String username, String password) throws Exception {
        return mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private static String token(String loginResponse) {
        return JsonPath.read(loginResponse, "$.data.token");
    }

    private static String refreshToken(String loginResponse) {
        return JsonPath.read(loginResponse, "$.data.refreshToken");
    }

    /**
     * The code in the last email event sent to this address (what the user would
     * read in the inbox).
     */
    private String lastOtp(String email) {
        ArgumentCaptor<Object> events = ArgumentCaptor.forClass(Object.class);
        verify(rabbitTemplate, atLeastOnce())
                .convertAndSend(eq(RabbitConfig.EVENTS_EXCHANGE), eq(RabbitConfig.EMAIL_ROUTING_KEY), events.capture());
        List<EmailNotificationEvent> mine = events.getAllValues().stream()
                .map(EmailNotificationEvent.class::cast)
                .filter(e -> e.to().equals(email))
                .toList();
        return (String) mine.get(mine.size() - 1).params().get(EmailNotificationEvent.PARAM_OTP);
    }
}
