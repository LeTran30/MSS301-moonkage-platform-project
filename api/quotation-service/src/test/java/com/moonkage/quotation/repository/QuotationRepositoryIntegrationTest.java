package com.moonkage.quotation.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteAcceptance;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceCopy;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceParties;
import com.moonkage.quotation.entity.QuoteItem;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.QuoteTerms;
import com.moonkage.quotation.entity.RequestInvitation;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.QuoteItemKind;
import com.moonkage.quotation.enums.QuoteStatus;
import com.moonkage.quotation.enums.RequestType;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Runs the Flyway migrations on a real PostgreSQL and lets Hibernate validate every entity against them
 * ({@code ddl-auto: validate}): an entity that drifts from the schema fails here instead of at container start.
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=validate")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class QuotationRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final Instant NOW = Instant.now().truncatedTo(ChronoUnit.MICROS);
    private static final LocalDate TODAY = LocalDate.ofInstant(NOW, ZoneOffset.UTC);

    private final EntityManager entityManager;
    private final QuoteRequestRepository quoteRequestRepository;
    private final RequestInvitationRepository requestInvitationRepository;
    private final QuoteRepository quoteRepository;
    private final QuoteAcceptanceRepository quoteAcceptanceRepository;
    private final VendorSnapshotRepository vendorSnapshotRepository;

    @Autowired
    QuotationRepositoryIntegrationTest(
            EntityManager entityManager,
            QuoteRequestRepository quoteRequestRepository,
            RequestInvitationRepository requestInvitationRepository,
            QuoteRepository quoteRepository,
            QuoteAcceptanceRepository quoteAcceptanceRepository,
            VendorSnapshotRepository vendorSnapshotRepository) {
        this.entityManager = entityManager;
        this.quoteRequestRepository = quoteRequestRepository;
        this.requestInvitationRepository = requestInvitationRepository;
        this.quoteRepository = quoteRepository;
        this.quoteAcceptanceRepository = quoteAcceptanceRepository;
        this.vendorSnapshotRepository = vendorSnapshotRepository;
    }

    @Test
    void requestWithInvitationAndQuoteLinesRoundTrips() {
        QuoteRequest request = saveRequest();
        requestInvitationRepository.saveAndFlush(RequestInvitation.of(request.getId(), "vendor-1"));
        Quote quote = quoteRepository.saveAndFlush(Quote.submit(request.getId(), "vendor-1", null, terms(), NOW));
        entityManager.clear();

        QuoteRequest savedRequest =
                quoteRequestRepository.findById(request.getId()).orElseThrow();
        Quote savedQuote = quoteRepository.findById(quote.getId()).orElseThrow();

        assertThat(savedRequest.getCustomTypes()).containsExactly(CustomType.BAG);
        assertThat(savedRequest.getDeliveryProvinceCode()).isEqualTo("79");
        assertThat(quoteRequestRepository.findInvitingVendor("vendor-1"))
                .extracting(QuoteRequest::getId)
                .containsExactly(request.getId());
        assertThat(savedQuote.getItems())
                .extracting(QuoteItem::getKind)
                .containsExactly(QuoteItemKind.PRODUCT, QuoteItemKind.CUSTOM);
        assertThat(savedQuote.getTotalAmount()).isEqualTo(12_530_000);
        assertThat(savedQuote.getDepositAmount()).isEqualTo(3_759_000);
        assertThat(savedQuote.getDepositRate()).isEqualByComparingTo("30.00");
    }

    @Test
    void expiryJobQueriesLeaveAQuoteWithAPendingDepositAlone() {
        QuoteRequest request = saveRequest();
        Quote locked = quoteRepository.saveAndFlush(Quote.submit(request.getId(), "vendor-1", null, terms(), NOW));
        Quote free = quoteRepository.saveAndFlush(Quote.submit(request.getId(), "vendor-2", null, terms(), NOW));
        quoteAcceptanceRepository.saveAndFlush(acceptance(locked, NOW.plusSeconds(60)));

        Instant afterValidity = NOW.plus(15, ChronoUnit.DAYS);
        int expiredAcceptances = quoteAcceptanceRepository.expireOverdue(
                NOW, AcceptanceStatus.PENDING_PAYMENT, AcceptanceStatus.EXPIRED);
        int expiredQuotes = quoteRepository.expireOverdue(
                afterValidity, QuoteStatus.SUBMITTED, QuoteStatus.EXPIRED, AcceptanceStatus.PENDING_PAYMENT);
        entityManager.clear();

        assertThat(expiredAcceptances).isZero();
        assertThat(expiredQuotes).isEqualTo(1);
        assertThat(quoteRepository.findById(locked.getId()).orElseThrow().getStatus())
                .isEqualTo(QuoteStatus.SUBMITTED);
        assertThat(quoteRepository.findById(free.getId()).orElseThrow().getStatus())
                .isEqualTo(QuoteStatus.EXPIRED);
    }

    @Test
    void theBindingCopyCannotBeRewritten() {
        QuoteRequest request = saveRequest();
        Quote quote = quoteRepository.saveAndFlush(Quote.submit(request.getId(), "vendor-1", null, terms(), NOW));
        QuoteAcceptance acceptance = quoteAcceptanceRepository.saveAndFlush(acceptance(quote, NOW.plusSeconds(900)));

        assertThatThrownBy(() -> entityManager
                        .createNativeQuery("update quote_acceptances set snapshot = '{\"forged\": true}' where id = ?1")
                        .setParameter(1, acceptance.getId())
                        .executeUpdate())
                .hasStackTraceContaining("binding copy");
    }

    @Test
    void vendorCopyMapsArraysAndJson() {
        String insert = """
                insert into vendor_snapshots (vendor_id, owner_account_id, business_name, tax_code, status,
                    can_operate, sells_shop, accepts_orders, supply_source, delivery_areas, min_qty,
                    ref_price_tiers, custom_capabilities, source_version)
                values ('vendor-1', 'owner-1', 'Trăng Vàng', '0312345678', 'APPROVED', true, false, true,
                    'BOTH', '{79,01}', 50, '[{"fromQty": 50, "unitPrice": 120000}]', '{BAG,CARD}', 3)""";
        entityManager.createNativeQuery(insert).executeUpdate();
        entityManager.clear();

        VendorSnapshot vendor =
                vendorSnapshotRepository.findFirstByOwnerAccountId("owner-1").orElseThrow();

        assertThat(vendor.getDeliveryAreas()).containsExactly("79", "01");
        assertThat(vendor.canMake(EnumSet.of(CustomType.BAG, CustomType.CARD))).isTrue();
        assertThat(vendor.canMake(EnumSet.of(CustomType.STICKER))).isFalse();
        assertThat(vendor.getRefPriceTiers()).contains("120000");
        assertThat(vendor.isTakingOrders()).isTrue();
        assertThat(vendorSnapshotRepository.findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc())
                .extracting(VendorSnapshot::getVendorId)
                .containsExactly("vendor-1");
    }

    private QuoteRequest saveRequest() {
        QuoteRequest request =
                QuoteRequest.open("buyer-1", RequestType.OPEN, null, null, 100, 15_000_000L, TODAY.plusDays(30));
        request.deliverTo("Nguyễn Thị Lan", "0901000001", "79", "12 Lê Lợi");
        request.customize(EnumSet.of(CustomType.BAG), "Logo hai màu");
        return quoteRequestRepository.saveAndFlush(request);
    }

    /** 100 × 120.000đ + logo on bags 100 × 5.000đ + 30.000đ shipping, 30% deposit, valid 7 days. */
    private static QuoteTerms terms() {
        return QuoteTerms.compute(
                List.of(
                        QuoteItem.product("Hộp 4 bánh", null, 100, 120_000),
                        QuoteItem.custom(CustomType.BAG, "In logo túi", 100, 5_000)),
                30_000,
                new BigDecimal("30"),
                TODAY.plusDays(20),
                "Giao tận nơi",
                NOW.plus(7, ChronoUnit.DAYS),
                null);
    }

    private static QuoteAcceptance acceptance(Quote quote, Instant paymentExpiresAt) {
        AcceptanceParties parties =
                new AcceptanceParties("NGUYEN THI LAN", "********0001", "Trăng Vàng", "0312345678", null);
        return QuoteAcceptance.pending(
                quote, "buyer-1", parties, new AcceptanceCopy("{\"a\": 1}", "a".repeat(64), paymentExpiresAt), NOW);
    }
}
