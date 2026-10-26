package com.moonkage.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.entity.ProductPriceTier;
import com.moonkage.catalog.entity.projection.ProductProjectionRow;
import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import com.moonkage.catalog.entity.projection.VendorProjectionRow;
import com.moonkage.catalog.entity.readmodel.ProductListing;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.repository.JdbcProjectionInboxRepository;
import com.moonkage.catalog.repository.ProductRepository;
import com.moonkage.catalog.repository.readmodel.ProductListingRepository;
import com.moonkage.catalog.service.CatalogProjectionService;
import com.moonkage.catalog.service.ProductReadService;
import com.moonkage.catalog.service.ProductService;
import com.moonkage.catalog.service.ProjectionInboxService;
import com.moonkage.storage.ObjectStorage;
import jakarta.persistence.EntityManagerFactory;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.IntConsumer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.RabbitListenerEndpointRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.EntityManagerFactoryUtils;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/** Full catalog startup and real I/O. Internal row fixtures do not define a producer's wire contract. */
@SpringBootTest(classes = CatalogServiceApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("c2-it")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Testcontainers
class CatalogProjectionIntegrationTest {
    private static final String VENDOR = "vendor-one";
    private static final String OWNER = "owner-one";
    private static final Instant REVIEW_TIME = Instant.parse("2026-10-26T07:00:00Z");

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Container
    static final GenericContainer<?> RABBIT = new GenericContainer<>(
                    DockerImageName.parse("rabbitmq:4.1-management-alpine"))
            .withEnv("RABBITMQ_DEFAULT_USER", "catalog-test")
            .withEnv("RABBITMQ_DEFAULT_PASS", "catalog-test")
            .withExposedPorts(5672)
            .waitingFor(Wait.forLogMessage(".*Server startup complete.*", 1));

    @DynamicPropertySource
    static void brokerProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.rabbitmq.host", RABBIT::getHost);
        properties.add("spring.rabbitmq.port", () -> RABBIT.getMappedPort(5672));
        properties.add("spring.rabbitmq.username", () -> "catalog-test");
        properties.add("spring.rabbitmq.password", () -> "catalog-test");
    }

    @MockitoSpyBean
    private JdbcProjectionInboxRepository inboxRepository;

    private final ApplicationContext context;
    private final JdbcTemplate jdbc;
    private final EntityManagerFactory entityManagerFactory;
    private final PlatformTransactionManager transactionManager;
    private final CatalogProjectionService projection;
    private final ProjectionInboxService inbox;
    private final ProductReadService products;
    private final TestRestTemplate http;
    private final RabbitTemplate rabbit;
    private final RabbitListenerEndpointRegistry listeners;
    private final AmqpAdmin admin;

    @Autowired
    CatalogProjectionIntegrationTest(
            ApplicationContext context,
            JdbcTemplate jdbc,
            EntityManagerFactory entityManagerFactory,
            PlatformTransactionManager transactionManager,
            CatalogProjectionService projection,
            ProjectionInboxService inbox,
            ProductReadService products,
            TestRestTemplate http,
            RabbitTemplate rabbit,
            RabbitListenerEndpointRegistry listeners,
            AmqpAdmin admin) {
        this.context = context;
        this.jdbc = jdbc;
        this.entityManagerFactory = entityManagerFactory;
        this.transactionManager = transactionManager;
        this.projection = projection;
        this.inbox = inbox;
        this.products = products;
        this.http = http;
        this.rabbit = rabbit;
        this.listeners = listeners;
        this.admin = admin;
    }

    @BeforeEach
    void resetDisposableDatabaseAndQueues() {
        listeners.stop();
        admin.getQueueProperties("catalog.projections");
        admin.purgeQueue("catalog.projections", false);
        admin.purgeQueue("catalog.projections.dlq", false);
        jdbc.execute("""
                TRUNCATE projection_inbox, processed_events, product_tombstones,
                    product_reviews, product_views, vendor_snapshots
                """);
    }

    @AfterEach
    void stopListeners() {
        listeners.stop();
    }

    @Test
    void startsWholeCatalogWithValidateAndOnlyReadModelEntities() {
        assertThat(context.getEnvironment().getProperty("spring.jpa.hibernate.ddl-auto"))
                .isEqualTo("validate");
        assertThat(entityManagerFactory.getMetamodel().getEntities())
                .extracting(type -> type.getJavaType().getName())
                .containsExactly(ProductListing.class.getName())
                .doesNotContain(Product.class.getName(), ProductPriceTier.class.getName());
        assertThat(context.getBeansOfType(ProductRepository.class)).isEmpty();
        assertThat(context.getBeansOfType(ProductService.class)).isEmpty();
        assertThat(context.getBeansOfType(ObjectStorage.class)).isEmpty();
        assertThat(jdbc.queryForObject("SELECT to_regclass('public.products')::text", String.class))
                .isNull();
        assertThat(jdbc.queryForObject("SELECT to_regclass('public.product_price_tiers')::text", String.class))
                .isNull();
        assertThat(http.getForEntity("/actuator/health", JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void roundTripsPostgresArraysOpaqueJsonAndJoinedView() {
        seedVendor();
        projection.applyProduct(id(), product("p", 0, "Bánh", ProductStatus.ON_SALE));
        var result = products.getProduct("p", "01", OWNER);
        assertThat(result.imageKeys()).containsExactly("products/p/cover one.png");
        assertThat(result.imageUrls().getFirst()).endsWith("/products/p/cover%20one.png");
        assertThat(result.priceTiers()).isEqualTo(opaqueTiers());
        assertThat(result.vendorName()).isEqualTo("Shop one");
        assertThat(result.isOwn()).isTrue();
        assertThat(jdbc.queryForObject("SELECT extname FROM pg_extension WHERE extname='pg_trgm'", String.class))
                .isEqualTo("pg_trgm");
        assertThat(jdbc.queryForList("SELECT indexdef FROM pg_indexes WHERE tablename='product_views'", String.class))
                .anyMatch(definition -> definition.contains("gin_trgm_ops"));
    }

    @Test
    void immutableEntityDoesNotPersistDirtyState() {
        seedVendor();
        projection.applyProduct(id(), product("p", 1, "original", ProductStatus.ON_SALE));
        var repository = context.getBean(ProductListingRepository.class);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            var listing = repository.findById("p").orElseThrow();
            ReflectionTestUtils.setField(listing, "name", "tampered");
            EntityManagerFactoryUtils.getTransactionalEntityManager(entityManagerFactory)
                    .flush();
        });
        assertThat(jdbc.queryForObject("SELECT name FROM product_views WHERE product_id='p'", String.class))
                .isEqualTo("original");
    }

    @Test
    void versionGateIgnoresOlderAndEqualSnapshots() {
        projection.applyProduct("latest", product("p", 10, "latest", ProductStatus.ON_SALE));
        assertThat(projection.applyProduct("older", product("p", 9, "old", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.STALE);
        assertThat(projection.applyProduct("equal", product("p", 10, "different", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.STALE);
        assertThat(projection.applyProduct("latest", product("p", 11, "retry changed", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.DUPLICATE);
        assertThat(jdbc.queryForObject("SELECT name FROM product_views WHERE product_id='p'", String.class))
                .isEqualTo("latest");
        assertThat(count("processed_events")).isEqualTo(3);
    }

    @Test
    void removalBeforeFirstSnapshotKeepsTombstoneWithoutFabricatingProduct() {
        projection.removeProduct("removed", "p", 10);
        assertThat(count("product_views")).isZero();
        assertThat(projection.applyProduct("late", product("p", 9, "late", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.STALE);
        assertThat(projection.applyProduct("future", product("p", 11, "resurrect", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.REMOVED);
        assertThat(count("product_views")).isZero();
        assertThat(count("product_tombstones")).isEqualTo(1);
    }

    @Test
    void oldRemovalCannotHideNewerProductButNewRemovalIsTerminal() {
        projection.applyProduct(id(), product("p", 10, "current", ProductStatus.ON_SALE));
        assertThat(projection.removeProduct(id(), "p", 9)).isEqualTo(ProjectionOutcome.STALE);
        assertThat(count("product_tombstones")).isZero();
        projection.removeProduct(id(), "p", 11);
        projection.applyProduct(id(), product("p", 12, "resurrect", ProductStatus.ON_SALE));
        assertThat(jdbc.queryForObject("SELECT status FROM product_views WHERE product_id='p'", String.class))
                .isEqualTo("REMOVED");
        assertThat(jdbc.queryForObject("SELECT source_version FROM product_views WHERE product_id='p'", Long.class))
                .isEqualTo(11);
    }

    @Test
    void existingRemovedRowCannotResurrectEvenIfTombstoneIsMissing() {
        projection.applyProduct(id(), product("p", 1, "removed", ProductStatus.REMOVED));
        jdbc.update("DELETE FROM product_tombstones WHERE product_id='p'");
        assertThat(projection.applyProduct(id(), product("p", 2, "resurrect", ProductStatus.ON_SALE)))
                .isEqualTo(ProjectionOutcome.REMOVED);
        assertThat(jdbc.queryForObject("SELECT status FROM product_views WHERE product_id='p'", String.class))
                .isEqualTo("REMOVED");
    }

    @Test
    void newMigrationBackfillsTombstonesFromPreExistingRemovedProjectionRows() {
        // An additional disposable DB in this test's PostgreSQL container, never the project's DB.
        jdbc.execute("CREATE DATABASE catalog_pre_c2");
        var dataSource = new org.springframework.jdbc.datasource.DriverManagerDataSource(
                "jdbc:postgresql://" + POSTGRES.getHost() + ":" + POSTGRES.getMappedPort(5432) + "/catalog_pre_c2",
                POSTGRES.getUsername(),
                POSTGRES.getPassword());
        org.flywaydb.core.Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target("2026.10.22.1000")
                .load()
                .migrate();
        var beforeMigration = new JdbcTemplate(dataSource);
        beforeMigration.update("""
                INSERT INTO product_views(product_id, vendor_id, name, description, list_price, stock,
                    expiry_date, delivery_label, status, source_version)
                VALUES ('pre-existing', 'vendor', 'removed', 'description', 100000, 1,
                    '2027-01-01', 'LOCAL', 'REMOVED', 7)
                """);
        org.flywaydb.core.Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();
        assertThat(beforeMigration.queryForObject(
                        "SELECT source_version FROM product_tombstones WHERE product_id='pre-existing'", Long.class))
                .isEqualTo(7);
    }

    @Test
    void reviewsBeforeProductAndSubsequentUpsertsNeverLoseAggregate() {
        projection.applyReview("r1-event", review("r1", "p", 5));
        projection.applyReview("r2-event", review("r2", "p", 3));
        assertThat(count("product_reviews")).isEqualTo(2);
        projection.applyProduct(id(), product("p", 1, "first", ProductStatus.ON_SALE));
        projection.applyProduct(id(), product("p", 2, "updated", ProductStatus.ON_SALE));
        assertThat(jdbc.queryForObject("SELECT rating_count FROM product_views WHERE product_id='p'", Integer.class))
                .isEqualTo(2);
        assertThat(jdbc.queryForObject(
                        "SELECT rating_avg FROM product_views WHERE product_id='p'", java.math.BigDecimal.class))
                .isEqualByComparingTo("4.00");
    }

    @Test
    void reviewDedupUsesBothEventIdAndReviewId() {
        var row = review("r1", "p", 5);
        projection.applyReview("first", row);
        assertThat(projection.applyReview("first", row)).isEqualTo(ProjectionOutcome.DUPLICATE);
        assertThat(projection.applyReview("other-event", row)).isEqualTo(ProjectionOutcome.DUPLICATE);
        assertThat(count("product_reviews")).isEqualTo(1);
        assertThat(count("processed_events")).isEqualTo(2);
    }

    @Test
    void conflictingReviewRollsBackEventClaim() {
        projection.applyReview("first", review("r1", "p", 5));
        assertThatThrownBy(() -> projection.applyReview("conflict", review("r1", "p", 1)))
                .isInstanceOf(com.moonkage.catalog.exception.CatalogException.class);
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM processed_events WHERE event_id='conflict'", Integer.class))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT rating FROM product_reviews WHERE review_id='r1'", Integer.class))
                .isEqualTo(5);
    }

    @Test
    void productVendorConflictRollsBackInsteadOfSilentlyDroppingEarlyReviews() {
        projection.applyReview(id(), new ReviewProjectionRow("r", "p", "other-vendor", 5, null, REVIEW_TIME));
        assertThatThrownBy(() ->
                        projection.applyProduct("bad-product", product("p", 1, "conflict", ProductStatus.ON_SALE)))
                .isInstanceOf(com.moonkage.catalog.exception.CatalogException.class);
        assertThat(count("product_views")).isZero();
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM processed_events WHERE event_id='bad-product'", Integer.class))
                .isZero();
    }

    @Test
    void vendorLockUnlockUsesOneVersionStreamAndDoesNotOverwriteProduct() {
        seedVendor();
        projection.applyProduct(id(), product("p", 10, "product", ProductStatus.ON_SALE));
        assertThat(products.search("01", null, null, null, 0, 20).totalElements())
                .isEqualTo(1);
        projection.applyVendor("lock", "vendor.locked", vendor(2, true));
        assertThat(products.search("01", null, null, null, 0, 20).totalElements())
                .isZero();
        assertThat(projection.applyVendor("old-update", "vendor.updated", vendor(1, false)))
                .isEqualTo(ProjectionOutcome.STALE);
        projection.applyVendor("unlock", "vendor.updated", vendor(3, false));
        assertThat(projection.applyVendor("old-lock", "vendor.locked", vendor(2, true)))
                .isEqualTo(ProjectionOutcome.STALE);
        assertThat(products.search("01", null, null, null, 0, 20).totalElements())
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT source_version FROM product_views WHERE product_id='p'", Long.class))
                .isEqualTo(10);
    }

    @Test
    void hidesNonOperatingNonShopHiddenAndRemovedRows() {
        seedVendor();
        projection.applyProduct(id(), product("hidden", 1, "hidden", ProductStatus.HIDDEN));
        projection.applyProduct(id(), product("removed", 1, "removed", ProductStatus.REMOVED));
        projection.applyProduct(id(), product("sale", 1, "sale", ProductStatus.ON_SALE));
        assertThat(products.search("01", null, null, null, 0, 20).totalElements())
                .isEqualTo(1);
        projection.applyVendor(
                id(),
                "vendor.updated",
                new VendorProjectionRow(VENDOR, OWNER, "Shop one", "APPROVED", true, false, List.of("01"), 10000L, 2));
        assertThat(products.search("01", null, null, null, 0, 20).totalElements())
                .isZero();
        assertThatThrownBy(() -> products.getProduct("sale", "01", null))
                .isInstanceOf(com.moonkage.catalog.exception.CatalogException.class);
    }

    @Test
    void validatesProvincePaginationAndLiteralSearchThroughHttp() {
        seedVendor();
        projection.applyProduct(id(), product("p", 1, "Bánh ABC", ProductStatus.ON_SALE));
        assertThat(http.getForEntity("/api/products", JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(http.getForEntity("/api/products?provinceCode=99", JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(http.getForEntity("/api/products?provinceCode=01&size=101", JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        var result = http.getForObject("/api/products?provinceCode=01&q=ABC", JsonNode.class);
        assertThat(result.at("/data/totalElements").asInt()).isEqualTo(1);
        assertThat(products.search("01", null, "%", null, 0, 20).totalElements())
                .isZero();
        assertThat(products.search("79", null, null, null, 0, 20).totalElements())
                .isZero();
        assertThat(http.getForEntity("/api/products/p?provinceCode=79", JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void nationwideProductIsVisibleOutsideVendorAreaAndReviewsArePaged() {
        seedVendor();
        var local = product("p", 1, "nationwide", ProductStatus.ON_SALE);
        var national = new ProductProjectionRow(
                local.productId(),
                local.vendorId(),
                local.name(),
                local.description(),
                local.cakeType(),
                local.brand(),
                local.origin(),
                local.piecesPerBox(),
                local.listPrice(),
                local.stock(),
                local.expiryDate(),
                DeliveryLabel.NATIONWIDE,
                local.quoteThreshold(),
                local.status(),
                local.imageKeys(),
                local.priceTiers(),
                local.sourceVersion());
        projection.applyProduct(id(), national);
        projection.applyReview(id(), review("review", "p", 4));
        assertThat(products.search("79", VENDOR, null, null, 0, 20).totalElements())
                .isEqualTo(1);
        var reviews = http.getForObject("/api/products/p/reviews?provinceCode=79", JsonNode.class);
        assertThat(reviews.at("/data/totalElements").asInt()).isEqualTo(1);
        assertThat(reviews.at("/data/content/0/rating").asInt()).isEqualTo(4);
    }

    @Test
    void concurrentProductVersionsConvergeToHighestSourceVersion() throws Exception {
        parallel(
                24,
                index -> projection.applyProduct(
                        "event-" + index, product("p", index, "version-" + index, ProductStatus.ON_SALE)));
        assertThat(jdbc.queryForObject("SELECT source_version FROM product_views WHERE product_id='p'", Long.class))
                .isEqualTo(23);
        assertThat(jdbc.queryForObject("SELECT name FROM product_views WHERE product_id='p'", String.class))
                .isEqualTo("version-23");
        assertThat(count("processed_events")).isEqualTo(24);
    }

    @Test
    void concurrentReviewAndProductUpdatesNeverLoseRatings() throws Exception {
        parallel(24, index -> {
            projection.applyReview("review-event-" + index, review("review-" + index, "p", 4));
            projection.applyProduct("product-event-" + index, product("p", index, "product", ProductStatus.ON_SALE));
        });
        assertThat(jdbc.queryForObject("SELECT rating_count FROM product_views WHERE product_id='p'", Integer.class))
                .isEqualTo(24);
        assertThat(jdbc.queryForObject(
                        "SELECT rating_avg FROM product_views WHERE product_id='p'", java.math.BigDecimal.class))
                .isEqualByComparingTo("4.00");
    }

    @Test
    void concurrentDuplicateEventIsAppliedOnlyOnce() throws Exception {
        parallel(12, index -> projection.applyReview("same-event", review("r", "p", 5)));
        assertThat(count("processed_events")).isEqualTo(1);
        assertThat(count("product_reviews")).isEqualTo(1);
    }

    @Test
    void concurrentVendorVersionsUseAtomicUpsert() throws Exception {
        parallel(
                20,
                index -> projection.applyVendor(
                        "vendor-event-" + index,
                        index % 2 == 0 ? "vendor.locked" : "vendor.updated",
                        vendor(index, index % 2 == 0)));
        assertThat(jdbc.queryForObject(
                        "SELECT source_version FROM vendor_snapshots WHERE vendor_id=?", Long.class, VENDOR))
                .isEqualTo(19);
        assertThat(jdbc.queryForObject(
                        "SELECT can_operate FROM vendor_snapshots WHERE vendor_id=?", Boolean.class, VENDOR))
                .isTrue();
    }

    @Test
    void ratingRebuildIsNonDestructiveAndDoesNotEraseEventClaims() {
        projection.applyProduct(id(), product("p", 1, "product", ProductStatus.ON_SALE));
        projection.applyReview(id(), review("r", "p", 3));
        jdbc.update("UPDATE product_views SET rating_count=99, rating_avg=1 WHERE product_id='p'");
        projection.rebuildRating("p");
        assertThat(jdbc.queryForObject("SELECT rating_count FROM product_views WHERE product_id='p'", Integer.class))
                .isEqualTo(1);
        assertThat(count("processed_events")).isEqualTo(2);
    }

    @Test
    void capturesApprovedEnvelopeMinimumWithoutGuessingBusinessPayload() {
        inbox.capture("product.upserted", bytes("{\"eventId\":\"pending\",\"unknownPatchOrSnapshot\":{\"x\":1}}"));
        assertThat(inbox.capture(
                        "product.upserted", bytes("{\"unknownPatchOrSnapshot\":{\"x\":1},\"eventId\":\"pending\"}")))
                .isFalse();
        assertThat(inbox.findPending(10)).hasSize(1);
        assertThat(count("processed_events")).isZero();
        assertThat(count("product_views")).isZero();
        assertThatThrownBy(
                        () -> inbox.capture("product.upserted", bytes("{\"eventId\":\"pending\",\"different\":true}")))
                .isInstanceOf(com.moonkage.catalog.exception.CatalogException.class);
        assertThat(count("projection_inbox")).isEqualTo(1);
    }

    @Test
    void pendingInboxIsReplaySourceAndRemainsAfterInternalProjection() {
        inbox.capture("product.upserted", bytes("{\"eventId\":\"pending\"}"));
        assertThat(inbox.findPending(10)).hasSize(1);
        // Explicit test-only normalization. No production adapter derives this row from that JSON.
        projection.applyProduct("pending", product("p", 1, "product", ProductStatus.ON_SALE));
        assertThat(inbox.findPending(10)).isEmpty();
        assertThat(count("projection_inbox")).isEqualTo(1);
    }

    @Test
    void actualRabbitCapturesConcurrentRedeliveriesWithoutMarkingProcessed() {
        CountDownLatch bothConsumersEntered = new CountDownLatch(2);
        org.mockito.Mockito.doAnswer(invocation -> {
                    bothConsumersEntered.countDown();
                    if (!bothConsumersEntered.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException(
                                "Both inbox consumers must enter the duplicate claim concurrently");
                    }
                    return invocation.callRealMethod();
                })
                .when(inboxRepository)
                .capture("lock-pending", "vendor.locked", "{\"eventId\":\"lock-pending\",\"unknownSignal\":true}");
        listeners.start();
        for (int index = 0; index < 12; index++) {
            send("vendor.locked", "{\"eventId\":\"lock-pending\",\"unknownSignal\":true}");
        }
        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(count("projection_inbox")).isEqualTo(1));
        listeners.stop();
        assertThat(bothConsumersEntered.getCount()).isZero();
        assertThat(count("processed_events")).isZero();
        assertThat(count("vendor_snapshots")).isZero();
    }

    @Test
    void actualRabbitDeadLettersMalformedEnvelope() {
        listeners.start();
        send("review.created", "{\"rating\":5}");
        var rejected = rabbit.receive("catalog.projections.dlq", 5000);
        assertThat(rejected).isNotNull();
        assertThat(new String(rejected.getBody(), StandardCharsets.UTF_8)).contains("rating");
        assertThat(count("projection_inbox")).isZero();
        assertThat(count("processed_events")).isZero();
    }

    @Test
    void actualRabbitDeadLettersJsonThatCannotFitPostgresJsonb() {
        listeners.start();
        send("review.created", "{\"eventId\":\"bad\\u0000id\"}");
        assertThat(rabbit.receive("catalog.projections.dlq", 5000)).isNotNull();
        assertThat(count("projection_inbox")).isZero();
        assertThat(count("processed_events")).isZero();
    }

    @Test
    void actualRabbitRetriesDatabaseFailureBeforeAck() {
        org.mockito.Mockito.doThrow(new org.springframework.dao.TransientDataAccessResourceException("test DB outage"))
                .doCallRealMethod()
                .when(inboxRepository)
                .capture("retry", "review.created", "{\"eventId\":\"retry\"}");
        listeners.start();
        send("review.created", "{\"eventId\":\"retry\"}");
        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(count("projection_inbox")).isEqualTo(1));
        assertThat(count("processed_events")).isZero();
    }

    @Test
    void actualRabbitDeadLettersConflictingEventIdentityWithoutOverwritingInbox() {
        inbox.capture("product.removed", bytes("{\"eventId\":\"conflict\",\"unknown\":1}"));
        listeners.start();
        send("product.removed", "{\"eventId\":\"conflict\",\"unknown\":2}");
        assertThat(rabbit.receive("catalog.projections.dlq", 5000)).isNotNull();
        assertThat(jdbc.queryForObject(
                        "SELECT payload->>'unknown' FROM projection_inbox WHERE event_id='conflict'", String.class))
                .isEqualTo("1");
        assertThat(count("processed_events")).isZero();
    }

    private void seedVendor() {
        projection.applyVendor(id(), "vendor.updated", vendor(1, false));
    }

    private VendorProjectionRow vendor(long version, boolean locked) {
        return new VendorProjectionRow(
                VENDOR,
                OWNER,
                "Shop one",
                locked ? "LOCKED" : "APPROVED",
                !locked,
                true,
                List.of("01"),
                15000L,
                version);
    }

    private ProductProjectionRow product(String productId, long version, String name, ProductStatus status) {
        return new ProductProjectionRow(
                productId,
                VENDOR,
                name,
                "description",
                "cake",
                "brand",
                "VN",
                4,
                100000,
                10,
                LocalDate.of(2027, 1, 1),
                DeliveryLabel.LOCAL,
                null,
                status,
                List.of("products/" + productId + "/cover one.png"),
                opaqueTiers(),
                version);
    }

    private JsonNode opaqueTiers() {
        // Intentionally opaque: test jsonb preservation without endorsing an unapproved wire tier shape.
        var array = JsonNodeFactory.instance.arrayNode();
        array.addObject().put("uninterpretedTierFixture", true);
        return array;
    }

    private ReviewProjectionRow review(String reviewId, String productId, int rating) {
        return new ReviewProjectionRow(reviewId, productId, VENDOR, rating, "review", REVIEW_TIME);
    }

    private long count(String table) {
        // Only fixed table names from this test class, never request input.
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }

    private void send(String routingKey, String json) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        rabbit.send("moonkage.events", routingKey, new Message(bytes(json), properties));
    }

    private static byte[] bytes(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    private static String id() {
        return UUID.randomUUID().toString();
    }

    private static void parallel(int count, IntConsumer action) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(6)) {
            List<Callable<Void>> tasks = new ArrayList<>();
            for (int index = 0; index < count; index++) {
                int value = index;
                tasks.add(() -> {
                    if (!start.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Start latch timed out");
                    }
                    action.accept(value);
                    return null;
                });
            }
            var futures = tasks.stream().map(executor::submit).toList();
            start.countDown();
            for (var future : futures) {
                future.get(20, TimeUnit.SECONDS);
            }
        }
    }
}
