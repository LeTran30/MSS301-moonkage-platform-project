package com.moonkage.identity;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.GeneratedValue;
import java.util.UUID;

/**
 * Rules of the two foundation modules built in plan v2 phase 3 (3.3, 3.5, 8.2). They hold for {@code shared} and
 * {@code platform} now; phase 9 widens them to every module.
 */
@AnalyzeClasses(
        packages = "com.moonkage.identity",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class FoundationArchitectureTest {

    private static final String SHARED = "com.moonkage.identity.shared..";
    private static final String PLATFORM = "com.moonkage.identity.platform..";

    /** The business modules: the foundation must not know any of them. */
    private static final String[] BUSINESS_MODULES = {
        "com.moonkage.identity.account..",
        "com.moonkage.identity.profile..",
        "com.moonkage.identity.address..",
        "com.moonkage.identity.otp..",
        "com.moonkage.identity.nfc..",
        "com.moonkage.identity.auth.."
    };

    @ArchTest
    static final ArchRule SHARED_IS_PLAIN_JAVA = classes()
            .that()
            .resideInAPackage(SHARED)
            // its package-info only marks the Modulith module as open
            .and()
            .doNotHaveSimpleName("package-info")
            .should()
            .onlyDependOnClassesThat()
            .resideInAnyPackage(SHARED, "java..")
            .because("shared is the common language of every module and changes the slowest (plan v2 3.3)");

    @ArchTest
    static final ArchRule PLATFORM_KNOWS_NO_BUSINESS_MODULE = noClasses()
            .that()
            .resideInAPackage(PLATFORM)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(BUSINESS_MODULES)
            .because("platform is technique without business; modules plug in through its SPIs (plan v2 3.3)");

    @ArchTest
    static final ArchRule SHARED_KNOWS_NOTHING_ELSE_IN_THE_SERVICE = noClasses()
            .that()
            .resideInAPackage(SHARED)
            .should()
            .dependOnClassesThat()
            .resideInAPackage(PLATFORM)
            .because("platform depends on shared, never the other way");

    @ArchTest
    static final ArchRule NO_CATCH_ALL_PACKAGES = noClasses()
            .should()
            .resideInAnyPackage("..common..", "..util..", "..helper..")
            .because("a package is named after what it holds (plan v2 3.5)");

    @ArchTest
    static final ArchRule FOUNDATION_AVOIDS_FORBIDDEN_SUFFIXES = noClasses()
            .that()
            .resideInAnyPackage(SHARED, PLATFORM)
            .should()
            .haveSimpleNameEndingWith("Impl")
            .orShould()
            .haveSimpleNameEndingWith("Constant")
            .orShould()
            .haveSimpleNameEndingWith("Mapper")
            .because("no Service/ServiceImpl pairs, input rules live in value objects, mapping lives in from(...)");

    @ArchTest
    static final ArchRule FOUNDATION_ENTITIES_GET_THEIR_ID_BEFORE_SAVING = fields().that()
            .areDeclaredInClassesThat()
            .resideInAnyPackage(SHARED, PLATFORM)
            .should()
            .notBeAnnotatedWith(GeneratedValue.class)
            .because("ids are made when an object is created, through IdGenerator (plan v2 5.5.1)");

    @ArchTest
    static final ArchRule FOUNDATION_MAKES_NO_RANDOM_UUID = noClasses()
            .that()
            .resideInAnyPackage(SHARED, PLATFORM)
            .should()
            .callMethod(UUID.class, "randomUUID")
            .because("entity and event ids come from IdGenerator (UUID v7), secrets from SecureRandom (plan v2 8.2)");
}
