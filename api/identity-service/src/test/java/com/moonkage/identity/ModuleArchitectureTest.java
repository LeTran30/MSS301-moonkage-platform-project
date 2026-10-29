package com.moonkage.identity;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.GeneratedValue;
import java.util.UUID;

/**
 * Layout and naming rules of plan v2 (3.3 to 3.5, 8.2) for the modules already rebuilt ({@link RebuiltModules}).
 * Phase 9 runs them for every module, next to Spring Modulith's verify.
 */
@AnalyzeClasses(
        packages = "com.moonkage.identity",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class ModuleArchitectureTest {

    private static final String SHARED = RebuiltModules.BASE_PACKAGE + ".shared..";

    @ArchTest
    static void otherCodeUsesOnlyTheRootOfAModule(JavaClasses classes) {
        for (String module : RebuiltModules.NAMES) {
            String root = RebuiltModules.BASE_PACKAGE + "." + module;
            noClasses()
                    .that()
                    .resideOutsideOfPackage(root + "..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(root + ".domain..", root + ".application..", root + ".infrastructure..")
                    .because("the root package is the module's contract; the rest may change freely (3.3)")
                    .check(classes);
        }
    }

    @ArchTest
    static void rootDependsOnlyOnShared(JavaClasses classes) {
        for (String module : RebuiltModules.NAMES) {
            String root = RebuiltModules.BASE_PACKAGE + "." + module;
            classes()
                    .that()
                    .resideInAPackage(root)
                    .should()
                    .onlyDependOnClassesThat()
                    .resideInAnyPackage(root, SHARED, "java..")
                    .because("the contract other modules compile against carries no framework and no internals (3.4)")
                    .check(classes);
        }
    }

    @ArchTest
    static void domainKnowsNoFrameworkAndNoOuterLayer(JavaClasses classes) {
        for (String module : RebuiltModules.NAMES) {
            String root = RebuiltModules.BASE_PACKAGE + "." + module;
            noClasses()
                    .that()
                    .resideInAPackage(root + ".domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(root + ".application..", root + ".infrastructure..", "org.springframework..")
                    .because("the domain holds the rules; JPA annotations are its only framework (3.4, ADR-1)")
                    .check(classes);
        }
    }

    @ArchTest
    static void applicationDoesNotReachIntoInfrastructure(JavaClasses classes) {
        for (String module : RebuiltModules.NAMES) {
            String root = RebuiltModules.BASE_PACKAGE + "." + module;
            noClasses()
                    .that()
                    .resideInAPackage(root + ".application..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage(root + ".infrastructure..")
                    .because("use cases talk to ports; adapters implement them (3.4)")
                    .check(classes);
        }
    }

    @ArchTest
    static final ArchRule NO_FORBIDDEN_SUFFIXES = noClasses()
            .that()
            .resideInAnyPackage(RebuiltModules.packagePatterns())
            .should()
            .haveSimpleNameEndingWith("Impl")
            .orShould()
            .haveSimpleNameEndingWith("Constant")
            .orShould()
            .haveSimpleNameEndingWith("Mapper")
            .orShould()
            .haveSimpleNameEndingWith("Service")
            .because("a use case is named by its verb, input rules live in value objects, mapping in from(...) (3.5)");

    @ArchTest
    static final ArchRule ENTITIES_GET_THEIR_ID_BEFORE_SAVING = fields().that()
            .areDeclaredInClassesThat()
            .resideInAnyPackage(RebuiltModules.packagePatterns())
            .should()
            .notBeAnnotatedWith(GeneratedValue.class)
            .because("ids are made when an object is created, through IdGenerator (5.5.1)");

    @ArchTest
    static final ArchRule NO_RANDOM_UUID = noClasses()
            .that()
            .resideInAnyPackage(RebuiltModules.packagePatterns())
            .should()
            .callMethod(UUID.class, "randomUUID")
            .because("entity ids come from IdGenerator (UUID v7), secrets from SecureRandom (8.2)");
}
