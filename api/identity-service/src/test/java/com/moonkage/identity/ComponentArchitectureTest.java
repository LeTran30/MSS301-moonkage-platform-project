package com.moonkage.identity;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;
import org.springframework.data.repository.Repository;
import org.springframework.web.bind.annotation.RestController;

/**
 * Package-by-component rules of the components not rebuilt yet (plan v2 replaces them module by module). Each
 * top-level package (account, profile, address, kyc, auth, otp, email) is a component: other code uses its public
 * service interface and DTOs; its entities, repositories and implementations are package-private. {@code web} is the
 * only HTTP entry point and nothing depends on it. Cycles are checked by the shared ArchitectureTest
 * (NO_PACKAGE_CYCLES); the foundation modules by FoundationArchitectureTest, the rebuilt modules by
 * ModuleArchitectureTest (their entities are public inside the module, and only the module root is used outside).
 *
 * <pre>
 * web ──▶ auth ──▶ account ──▶ profile
 *  │        │         ▲
 *  │        ├──▶ otp, email
 *  │        └──▶ security ──▶ account
 *  └──▶ address, kyc ──▶ account        (all ──▶ shared, platform)
 * </pre>
 */
@AnalyzeClasses(
        packages = "com.moonkage.identity",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class ComponentArchitectureTest {

    @ArchTest
    static final ArchRule ENTITIES_STAY_INSIDE_THEIR_COMPONENT = classes()
            .that()
            .areAnnotatedWith(Entity.class)
            .and()
            .resideOutsideOfPackages(RebuiltModules.packagePatterns())
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
            .resideInAPackage("com.moonkage.identity.web..")
            .because("web is the HTTP layer outside every component");

    @ArchTest
    static final ArchRule NOTHING_DEPENDS_ON_WEB = noClasses()
            .that()
            .resideOutsideOfPackage("com.moonkage.identity.web..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("com.moonkage.identity.web..")
            .because("components must not know how they are exposed over HTTP");

    @ArchTest
    static final ArchRule ENTITIES_DO_NOT_DEPEND_ON_SPRING_SECURITY = noClasses()
            .that()
            .areAnnotatedWith(Entity.class)
            .should()
            .dependOnClassesThat()
            .resideInAPackage("org.springframework.security..")
            .because("the login principal is security's AccountPrincipal, not the Account entity");
}
