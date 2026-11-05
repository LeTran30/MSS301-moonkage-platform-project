package com.moonkage.catalog.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * The legacy write model of products must not come back (audit M-05; decisions L-04, L-18, D-27).
 *
 * <p>The baseline {@code V1__baseline.sql} still describes a {@code products} table with a {@code deleted} column,
 * but the baseline is a historical file that must never be edited. This test runs the real migrations against a real
 * Postgres and asserts the end state:
 *
 * <ul>
 *   <li>the three legacy tables are gone,
 *   <li>no table of the read model has a {@code deleted} column any more,
 *   <li>the read model the service actually reads is there, so the migration did not drop too much,
 *   <li>the migration that states the end state is recorded by Flyway.
 * </ul>
 */
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = LegacyProductsTableMigrationTest.Config.class)
@TestPropertySource(
        properties = {
            "spring.datasource.url=jdbc:postgresql://localhost/unused",
            "spring.datasource.username=test",
            "spring.datasource.password=test",
            "spring.flyway.locations=classpath:db/migration",
            "spring.flyway.baseline-on-migrate=false"
        })
@Testcontainers(disabledWithoutDocker = true)
class LegacyProductsTableMigrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final JdbcTemplate jdbc;

    @Autowired
    LegacyProductsTableMigrationTest(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Test
    void theLegacyWriteModelOfProductsIsGone() {
        for (String table : List.of("products", "product_price_tiers", "product_images")) {
            assertThat(jdbc.queryForObject("SELECT to_regclass('public." + table + "')::text", String.class))
                    .as("the legacy table %s must not exist any more", table)
                    .isNull();
        }
    }

    @Test
    void noTableOfTheReadModelCarriesTheRemovedSoftDeleteColumn() {
        List<String> columns = jdbc.queryForList("""
                        SELECT table_name || '.' || column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND column_name = 'deleted'
                        """, String.class);
        assertThat(columns).isEmpty();
    }

    @Test
    void theReadModelTheServiceReadsIsStillThere() {
        // the tables of the read model and the view the one entity maps
        for (String relation :
                List.of("product_views", "vendor_snapshots", "product_reviews", "product_listings", "provinces")) {
            assertThat(jdbc.queryForObject("SELECT to_regclass('public." + relation + "')::text", String.class))
                    .as("the read model relation %s must survive the migration", relation)
                    .isNotNull();
        }
    }

    @Test
    void flywayRecordedTheMigrationThatStatesTheEndState() {
        List<String> versions = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank", String.class);
        assertThat(versions).contains("2026.11.06.1000");
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class Config {}
}
