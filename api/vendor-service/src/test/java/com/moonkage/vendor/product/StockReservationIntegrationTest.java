package com.moonkage.vendor.product;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.product.dto.request.ReserveStockRequest;
import com.moonkage.vendor.security.GatewayHeader;
import com.moonkage.vendor.security.Role;
import com.moonkage.vendor.vendor.SupplySource;
import com.moonkage.vendor.vendor.VendorFixture;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Phase 6 end to end on PostgreSQL: order-service holds the stock of a checkout, commits it when paid, releases it
 * when not, and the sweep releases expired holds (BR-28, P-01). The broker, MinIO, identity and payment are mocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class StockReservationIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String RESERVATIONS = "/internal/stock/reservations";
    private static final String TEMP_PREFIX = "tmp/";
    private static final long LIST_PRICE = 100_000;
    private static final long TIER_PRICE = 90_000;
    private static final int TIER_FROM = 50;

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
    private final StockService stockService;
    private final ExpiredReservationSweeper sweeper;

    private String ownerId;
    private String vendorId;

    @Autowired
    StockReservationIntegrationTest(
            MockMvc mvc,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate,
            ApplicationContext context,
            StockService stockService,
            ExpiredReservationSweeper sweeper) {
        this.mvc = mvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.vendorFixture = new VendorFixture(context);
        this.stockService = stockService;
        this.sweeper = sweeper;
    }

    @BeforeEach
    void setUp() {
        when(objectStorage.isTempKey(anyString()))
                .thenAnswer(call -> call.<String>getArgument(0).startsWith(TEMP_PREFIX));
        when(objectStorage.moveUploadedFile(anyString(), any(), eq(BucketAccess.PUBLIC), anyString()))
                .thenAnswer(call -> call.<String>getArgument(3) + "/" + UUID.randomUUID());
        ownerId = UUID.randomUUID().toString();
        vendorId = vendorFixture.saveOperating(ownerId, SupplySource.SELF_PRODUCED, true);
    }

    // ─── hold ───

    @Test
    void aHoldTakesTheStockAtTheTierPriceAndAnnouncesIt() throws Exception {
        String bulk = createProduct(100);
        String single = createProduct(10);
        String checkoutId = newId();

        reserve(checkoutId, Map.of(bulk, TIER_FROM + 10, single, 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HELD"))
                .andExpect(jsonPath("$.items[?(@.productId == '" + bulk + "')].unitPrice")
                        .value((int) TIER_PRICE))
                .andExpect(jsonPath("$.items[?(@.productId == '" + single + "')].unitPrice")
                        .value((int) LIST_PRICE))
                .andExpect(jsonPath("$.items[0].vendorId").value(vendorId));

        assertEquals(40, stockOf(bulk));
        assertEquals(8, stockOf(single));
        assertEquals(40, lastProductData(bulk).get("stock").asInt());
    }

    @Test
    void theSameCheckoutAgainAnswersTheSameAndOtherLinesAreRefused() throws Exception {
        String product = createProduct(10);
        String checkoutId = newId();
        reserve(checkoutId, Map.of(product, 3)).andExpect(status().isOk());

        reserve(checkoutId, Map.of(product, 3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].qty").value(3));
        assertEquals(7, stockOf(product));
        reserve(checkoutId, Map.of(product, 4))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_033"));
    }

    @Test
    void aShortLineHoldsNothingAndNamesEachProductShort() throws Exception {
        String enough = createProduct(10);
        String shortOne = createProduct(1);
        String hidden = createProduct(10);
        jdbcTemplate.update("UPDATE products SET status = 'HIDDEN' WHERE id = ?", hidden);
        String checkoutId = newId();

        reserve(checkoutId, Map.of(enough, 2, shortOne, 2, hidden, 1, "no-such-product", 1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_032"))
                .andExpect(
                        jsonPath("$.errors[*].field").value(containsInAnyOrder(shortOne, hidden, "no-such-product")));

        assertEquals(10, stockOf(enough));
        assertEquals(0, count(checkoutId));
    }

    @Test
    void aShopThatMayNotSellHoldsNothing() throws Exception {
        String product = createProduct(10);
        jdbcTemplate.update("UPDATE vendors SET status = 'LOCKED', status_reason = 'x' WHERE id = ?", vendorId);

        reserve(newId(), Map.of(product, 1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].field").value(product));
    }

    @Test
    void aHoldNeedsAFutureExpiryAndEachProductOnce() throws Exception {
        String product = createProduct(10);
        ObjectNode past = reserveBody(newId(), Map.of(product, 1))
                .put("expiresAt", Instant.now().minusSeconds(1).toString());
        mvc.perform(post(RESERVATIONS).contentType(MediaType.APPLICATION_JSON).content(past.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_115"));

        ObjectNode twice = reserveBody(newId(), Map.of(product, 1));
        twice.withArray("items")
                .add(objectMapper.createObjectNode().put("productId", product).put("qty", 1));
        mvc.perform(post(RESERVATIONS).contentType(MediaType.APPLICATION_JSON).content(twice.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VENDOR_114"));
    }

    // ─── commit, release ───

    @Test
    void aPaidCheckoutIsCommittedOnceAndCannotBeReleased() throws Exception {
        String product = createProduct(10);
        String checkoutId = newId();
        reserve(checkoutId, Map.of(product, 3));

        commit(checkoutId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMMITTED"));
        commit(checkoutId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMMITTED"));
        release(checkoutId)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_034"));
        assertEquals(7, stockOf(product));
        commit(newId())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VENDOR_031"));
    }

    @Test
    void anUnpaidCheckoutGivesItsStockBackOnce() throws Exception {
        String product = createProduct(10);
        String checkoutId = newId();
        reserve(checkoutId, Map.of(product, 3));

        release(checkoutId).andExpect(status().isNoContent());
        release(checkoutId).andExpect(status().isNoContent());
        release(newId()).andExpect(status().isNoContent());
        assertEquals(10, stockOf(product));
        assertEquals(10, lastProductData(product).get("stock").asInt());
    }

    @Test
    void aLatePaymentTakesTheStockAgainOrIsRefusedWhenItIsGone() throws Exception {
        String product = createProduct(5);
        String late = newId();
        reserve(late, Map.of(product, 3));
        release(late);

        commit(late).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMMITTED"));
        assertEquals(2, stockOf(product));

        String lost = newId();
        reserve(lost, Map.of(product, 2));
        release(lost);
        reserve(newId(), Map.of(product, 1));
        commit(lost)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VENDOR_032"))
                .andExpect(jsonPath("$.errors[0].field").value(product));
        assertEquals(1, stockOf(product));
    }

    // ─── sweep ───

    @Test
    void theSweepReleasesExpiredHoldsOnly() throws Exception {
        String product = createProduct(10);
        String expired = newId();
        String paid = newId();
        String current = newId();
        reserve(expired, Map.of(product, 1));
        reserve(paid, Map.of(product, 2));
        reserve(current, Map.of(product, 3));
        commit(paid);
        jdbcTemplate.update(
                "UPDATE stock_reservations SET expires_at = now() - interval '1 minute' WHERE checkout_id IN (?, ?)",
                expired,
                paid);

        sweeper.sweep();

        assertEquals("RELEASED", statusOf(expired));
        assertEquals("COMMITTED", statusOf(paid));
        assertEquals("HELD", statusOf(current));
        assertEquals(5, stockOf(product));
    }

    // ─── contention ───

    @Test
    void manyCheckoutsForFewPiecesNeverHoldMoreThanTheStock() throws Exception {
        int stock = 5;
        int checkouts = 20;
        String product = createProduct(stock);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int i = 0; i < checkouts; i++) {
                tasks.add(() -> tryReserve(product));
            }
            int held = 0;
            for (Future<Boolean> result : pool.invokeAll(tasks)) {
                held += result.get() ? 1 : 0;
            }
            assertEquals(stock, held);
        } finally {
            pool.shutdown();
        }
        assertEquals(0, stockOf(product));
        assertEquals(
                stock,
                jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(qty), 0) FROM stock_reservations WHERE product_id = ?",
                        Integer.class,
                        product));
    }

    // ─── helpers ───

    private boolean tryReserve(String product) {
        try {
            stockService.reserve(new ReserveStockRequest(
                    newId(),
                    Instant.now().plus(15, ChronoUnit.MINUTES),
                    List.of(new ReserveStockRequest.Item(product, 1))));
            return true;
        } catch (AppException e) {
            assertEquals(ErrorCode.STOCK_UNAVAILABLE, e.getErrorCode());
            return false;
        }
    }

    private String createProduct(int stock) throws Exception {
        ObjectNode body = objectMapper
                .createObjectNode()
                .put("name", "Hộp 4 bánh nướng")
                .put("description", "Bánh nướng nhân đậu xanh")
                .put("listPrice", LIST_PRICE)
                .put("stock", stock)
                .put("expiryDate", LocalDate.of(2026, 12, 31).toString())
                .put("deliveryLabel", "LOCAL");
        body.set("imageKeys", objectMapper.valueToTree(List.of(TEMP_PREFIX + "a.jpg")));
        body.set("crustCodes", objectMapper.valueToTree(List.of("banh-nuong")));
        body.set("fillingCodes", objectMapper.valueToTree(List.of("dau-xanh")));
        body.set(
                "priceTiers", objectMapper.valueToTree(List.of(Map.of("fromQty", TIER_FROM, "unitPrice", TIER_PRICE))));
        String response = mvc.perform(post("/api/vendors/{id}/products", vendorId)
                        .header(GatewayHeader.ACCOUNT_ID, ownerId)
                        .header(GatewayHeader.USER_ROLE, Role.MEMBER.name())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString()))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("data").get("id").asText();
    }

    private ObjectNode reserveBody(String checkoutId, Map<String, Integer> items) {
        ObjectNode body = objectMapper
                .createObjectNode()
                .put("checkoutId", checkoutId)
                .put("expiresAt", Instant.now().plus(15, ChronoUnit.MINUTES).toString());
        items.forEach((productId, qty) -> body.withArray("items")
                .add(objectMapper.createObjectNode().put("productId", productId).put("qty", qty)));
        return body;
    }

    private ResultActions reserve(String checkoutId, Map<String, Integer> items) throws Exception {
        return mvc.perform(post(RESERVATIONS)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reserveBody(checkoutId, items).toString()));
    }

    private ResultActions commit(String checkoutId) throws Exception {
        return mvc.perform(post(RESERVATIONS + "/{id}/commit", checkoutId));
    }

    private ResultActions release(String checkoutId) throws Exception {
        return mvc.perform(delete(RESERVATIONS + "/{id}", checkoutId));
    }

    private int stockOf(String productId) {
        return jdbcTemplate.queryForObject("SELECT stock FROM products WHERE id = ?", Integer.class, productId);
    }

    private int count(String checkoutId) {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM stock_reservations WHERE checkout_id = ?", Integer.class, checkoutId);
    }

    private String statusOf(String checkoutId) {
        return jdbcTemplate.queryForObject(
                "SELECT DISTINCT status FROM stock_reservations WHERE checkout_id = ?", String.class, checkoutId);
    }

    /** The product state of the last product.upserted of this product. */
    private JsonNode lastProductData(String productId) throws Exception {
        List<String> payloads = jdbcTemplate.queryForList(
                "SELECT payload FROM outbox_events WHERE routing_key = ? AND payload LIKE ?"
                        + " ORDER BY (payload::jsonb ->> 'sourceVersion')::bigint",
                String.class,
                RabbitConfig.PRODUCT_UPSERTED_ROUTING_KEY,
                "%" + productId + "%");
        return objectMapper.readTree(payloads.getLast()).get("data");
    }

    private static String newId() {
        return UUID.randomUUID().toString();
    }
}
