package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.jayway.jsonpath.JsonPath;
import com.moonkage.identity.IdentityServiceApplication;
import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSAEncrypter;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Characterization tests of identity-service's external contract (plan v2, section 2 and 8.1): HTTP, JSON, SQL and
 * messages only. Imports no production class but {@link IdentityServiceApplication}, so the tests outlive every
 * rewrite of the inside. All subclasses share one application context, one PostgreSQL and one RabbitMQ.
 *
 * <p>Time is the real clock: OTP and JWT still read the system time, so a fixed {@code Clock} would make them
 * disagree. Branches that need time to pass are listed as not covered in the phase 1 report.
 */
@SpringBootTest(classes = IdentityServiceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
abstract class ContractTest {

    static final String PASSWORD = "Secret@123";
    static final String NEW_PASSWORD = "Changed@456";
    static final String EMAIL_ROUTING_KEY = "orchestrator.email.identity";
    static final String REGISTRATION = "REGISTRATION";
    static final String FORGOT_PASSWORD = "FORGOT_PASSWORD";
    private static final String EMAIL_DOMAIN = "@contract.vn";
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    private static final RabbitMQContainer RABBIT = new RabbitMQContainer("rabbitmq:4.1-alpine");
    private static final KeyPair NFC_TRANSPORT_KEYS = rsaKeyPair();
    private static EventInbox inbox;

    MockMvc mvc;
    JdbcTemplate jdbc;
    private String jwtSecret;

    @DynamicPropertySource
    static void infrastructure(DynamicPropertyRegistry registry) {
        if (!POSTGRES.isRunning()) {
            POSTGRES.start();
            RABBIT.start();
        }
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.rabbitmq.host", RABBIT::getHost);
        registry.add("spring.rabbitmq.port", RABBIT::getAmqpPort);
        registry.add("spring.rabbitmq.username", RABBIT::getAdminUsername);
        registry.add("spring.rabbitmq.password", RABBIT::getAdminPassword);
        // relay outbox events at once, so a test sees them like orchestrator-service would
        registry.add("outbox.relay-interval", () -> "100ms");

        Base64.Encoder base64 = Base64.getEncoder();
        byte[] piiKey = new byte[32];
        new SecureRandom().nextBytes(piiKey);
        registry.add(
                "nfc.transport-private-key",
                () -> base64.encodeToString(NFC_TRANSPORT_KEYS.getPrivate().getEncoded()));
        registry.add("nfc.pii-key", () -> base64.encodeToString(piiKey));
        // fixed pepper: the id hash in /internal/accounts/check is part of the contract (vendor stores it)
        registry.add("nfc.id-hash-pepper", () -> "contract-pepper");
    }

    @BeforeEach
    void wire(ApplicationContext context) {
        mvc = context.getBean(MockMvc.class);
        jdbc = context.getBean(JdbcTemplate.class);
        jwtSecret = context.getEnvironment().getRequiredProperty("jwt.secret");
        synchronized (ContractTest.class) {
            if (inbox == null) {
                inbox = new EventInbox(context.getBean(RabbitTemplate.class), context.getBean(AmqpAdmin.class));
            }
        }
    }

    // ───────── HTTP ─────────

    /** Status and raw body of one request. */
    record Answer(int status, String body) {

        <T> T read(String path) {
            return JsonPath.read(body, path);
        }
    }

    Answer call(MockHttpServletRequestBuilder request) throws Exception {
        MockHttpServletResponse response = mvc.perform(request).andReturn().getResponse();
        return new Answer(response.getStatus(), response.getContentAsString(StandardCharsets.UTF_8));
    }

    Answer postJson(String path, String json) throws Exception {
        return call(post(path).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    Answer postJson(String path, String json, String token) throws Exception {
        return call(post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .header("Authorization", bearer(token)));
    }

    Answer getWith(String path, String token) throws Exception {
        return call(get(path).header("Authorization", bearer(token)));
    }

    static String bearer(String token) {
        return "Bearer " + token;
    }

    /** Asserts the answer against the approved snapshot {@code contract/<name>.json}. */
    static void assertContract(String name, Answer answer) {
        Golden.assertResponse(name, answer.status(), answer.body());
    }

    // ───────── accounts ─────────

    /** One address per test, so snapshots do not depend on test order. */
    static String email(String tag) {
        return tag + EMAIL_DOMAIN;
    }

    Answer register(String email, String phoneNumber) throws Exception {
        String phone = phoneNumber == null ? "" : ",\"phoneNumber\":\"" + phoneNumber + "\"";
        return postJson("/api/auth/register", """
                {"email":"%s"%s,"fullName":"Nguyen Lan","password":"%s"}""".formatted(email, phone, PASSWORD));
    }

    /** Registered and confirmed; logs in with {@link #PASSWORD}. */
    String activeAccount(String tag) throws Exception {
        return activeAccount(tag, null);
    }

    String activeAccount(String tag, String phoneNumber) throws Exception {
        String email = email(tag);
        assertEquals(200, register(email, phoneNumber).status(), "register " + email);
        Answer verified = postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, lastOtp(email, REGISTRATION)));
        assertEquals(200, verified.status(), "verify " + email);
        return email;
    }

    Answer login(String username, String password) throws Exception {
        return postJson("/api/auth/login", """
                {"username":"%s","password":"%s"}""".formatted(username, password));
    }

    /** Access token of an active account. */
    String accessToken(String email) throws Exception {
        Answer answer = login(email, PASSWORD);
        assertEquals(200, answer.status(), "login " + email);
        return answer.read("$.data.token");
    }

    String accountIdOf(String email) {
        return jdbc.queryForObject("SELECT id FROM accounts WHERE email = ?", String.class, email);
    }

    // ───────── messages ─────────

    EventInbox inbox() {
        return inbox;
    }

    /**
     * The code of the last OTP email sent to {@code email} with template {@code templateCode}, read
     * from the broker like orchestrator-service does.
     */
    String lastOtp(String email, String templateCode) {
        EventInbox.Event mail = inbox.awaitLast(
                e -> EMAIL_ROUTING_KEY.equals(e.routingKey())
                        && email.equals(Golden.read(e.body()).path("to").asText())
                        && Golden.read(e.body()).path("templateCode").asText().equals(templateCode),
                "OTP mail " + templateCode + " to " + email);
        return Golden.read(mail.body()).path("params").path("otp").asText();
    }

    // ───────── tokens made outside the service ─────────

    /** An access token signed with the service's key, for states login never hands out. */
    String craftedAccessToken(String subject, Instant issuedAt, Instant expiresAt) {
        return Jwts.builder()
                .subject(subject)
                .issuedAt(toDate(issuedAt))
                .claim("type", "ACCESS")
                .claim("role", "MEMBER")
                .expiration(toDate(expiresAt))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)), Jwts.SIG.HS256)
                .compact();
    }

    // jjwt's builder only accepts java.util.Date; keep it confined here, as JwtSessionTokens does
    @SuppressWarnings("JavaUtilDate")
    private static java.util.Date toDate(Instant instant) {
        return java.util.Date.from(instant);
    }

    // ───────── NFC ─────────

    String createNfcSession(String token) throws Exception {
        Answer created = call(post("/api/nfc/sessions").header("Authorization", bearer(token)));
        assertEquals(201, created.status(), "create NFC session");
        return created.read("$.data.sessionId");
    }

    /** A card as the app sends it: readable chip fields plus a JWE of the sensitive ones for the transport key. */
    static String cardBody(String idNumber, LocalDate dateOfExpiry) throws JOSEException {
        JWEObject jwe = new JWEObject(
                new JWEHeader(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM),
                new Payload(Map.of(
                        "idNumber", idNumber, "dateOfBirth", "1990-01-01", "placeOfResidence", "So 1 Duong Le Loi")));
        jwe.encrypt(new RSAEncrypter((RSAPublicKey) NFC_TRANSPORT_KEYS.getPublic()));
        return """
                {"fullName":"NGUYEN VAN AN","gender":"MALE","nationality":"Viet Nam","placeOfBirth":"Tinh Lam Dong",
                "dateOfIssue":"2024-01-01","dateOfExpiry":"%s","encryptedFields":"%s","appVersion":"contract"}
                """.formatted(dateOfExpiry, jwe.serialize());
    }

    static String validCard(String idNumber) throws JOSEException {
        return cardBody(idNumber, LocalDate.now(VIETNAM).plusYears(5));
    }

    Answer submitCard(String token, String sessionId, String body) throws Exception {
        return postJson("/api/nfc/sessions/" + sessionId + "/card", body, token);
    }

    /** Active account whose card is verified (FR-04). */
    String verifiedAccount(String tag, String idNumber) throws Exception {
        String email = activeAccount(tag);
        String token = accessToken(email);
        Answer result = submitCard(token, createNfcSession(token), validCard(idNumber));
        assertEquals("VERIFIED", result.read("$.data.status"), "card of " + email);
        return email;
    }

    private static KeyPair rsaKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
