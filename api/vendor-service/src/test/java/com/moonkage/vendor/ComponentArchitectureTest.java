package com.moonkage.vendor;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import org.springframework.data.repository.Repository;
import org.springframework.web.bind.annotation.RestController;

/**
 * Package-by-component rules of vendor-service (docs/conventions/coding-rules.md 1.1). Each top-level package
 * (vendor, registrationfee, inbox, outbox, ...) is a component: other code uses its public service interface and
 * DTOs; its entities, repositories and implementations are package-private. {@code web} is the only HTTP entry
 * point and nothing depends on it. Cycles between components are checked by the shared ArchitectureTest
 * (NO_PACKAGE_CYCLES).
 *
 * <pre>
 * web ──▶ vendor ──▶ cakeattribute, registrationfee ──▶ security, client, inbox, outbox   (all ──▶ common)
 * </pre>
 */
@AnalyzeClasses(
        packages = "com.moonkage.vendor",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class ComponentArchitectureTest {

    private static final String WEB = "com.moonkage.vendor.web..";

    @ArchTest
    static final ArchRule ENTITIES_STAY_INSIDE_THEIR_COMPONENT = classes()
            .that()
            .areAnnotatedWith(Entity.class)
            .or()
            .areAnnotatedWith(Embeddable.class)
            .should()
            .notBePublic()
            .because("other components read an entity through its component's service, never directly");

    @ArchTest
    static final ArchRule REPOSITORIES_STAY_INSIDE_THEIR_COMPONENT = classes()
            .that()
            .areAssignableTo(Repository.class)
            .should()
            .notBePublic()
            .because("only the component that owns a table queries it");

    @ArchTest
    static final ArchRule SERVICE_IMPLEMENTATIONS_STAY_INSIDE_THEIR_COMPONENT = classes()
            .that()
            .haveSimpleNameEndingWith("ServiceImpl")
            .should()
            .notBePublic()
            .because("callers depend on the service interface, the component's public API");

    @ArchTest
    static final ArchRule CONTROLLERS_LIVE_IN_WEB = classes()
            .that()
            .areAnnotatedWith(RestController.class)
            .should()
            .resideInAPackage(WEB)
            .because("web is the HTTP layer outside every component");

    @ArchTest
    static final ArchRule NOTHING_DEPENDS_ON_WEB = noClasses()
            .that()
            .resideOutsideOfPackage(WEB)
            .should()
            .dependOnClassesThat()
            .resideInAPackage(WEB)
            .because("components must not know how they are exposed over HTTP");
}
