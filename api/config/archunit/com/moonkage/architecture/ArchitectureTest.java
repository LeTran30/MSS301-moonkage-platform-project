package com.moonkage.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * T4 layering rules (CONTRIBUTING §8), shared by every service: the parent pom adds this folder as a
 * test source, so each module checks only its own classes.
 *
 * <pre>
 * controller ──▶ service ──▶ repository
 *      │            │
 *      └──▶ dto     ├──▶ mapper ──▶ dto, entity
 *                   └──▶ entity
 * </pre>
 *
 * <p>Modules without some layer (discovery-server, api-gateway) pass because empty rules are allowed.
 */
@AnalyzeClasses(
        packages = "com.moonkage",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class ArchitectureTest {

    @ArchTest
    static final ArchRule CONTROLLERS_DO_NOT_USE_REPOSITORIES = noClasses()
            .that()
            .resideInAPackage("..controller..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..repository..")
            .because("controllers go through a service")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule CONTROLLERS_DO_NOT_USE_ENTITIES = noClasses()
            .that()
            .resideInAPackage("..controller..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..entity..")
            .because("the API exposes DTOs, never JPA entities")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule DTOS_DO_NOT_USE_ENTITIES = noClasses()
            .that()
            .resideInAPackage("..dto..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..entity..")
            .because("entity-to-DTO conversion lives in the mapper package")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule REPOSITORIES_DO_NOT_USE_UPPER_LAYERS = noClasses()
            .that()
            .resideInAPackage("..repository..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..service..", "..controller..", "..dto..", "..mapper..")
            .because("repositories are the lowest layer")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule SERVICES_DO_NOT_USE_CONTROLLERS = noClasses()
            .that()
            .resideInAPackage("..service..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..controller..")
            .because("dependencies point downwards only")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule NO_PACKAGE_CYCLES = slices().matching("com.moonkage.(*).(*)..")
            .should()
            .beFreeOfCycles()
            .allowEmptyShould(true);
}
