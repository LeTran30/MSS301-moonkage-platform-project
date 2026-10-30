package com.moonkage.identity;

import static com.tngtech.archunit.core.domain.properties.CanBeAnnotated.Predicates.annotatedWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.constructors;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaConstructor;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.freeze.FreezingArchRule;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.MappedSuperclass;
import java.time.Clock;
import java.util.List;

/**
 * Rich entity rules: an entity keeps its own fields right, so it opens no write path that skips its checks, and it
 * reads the time from the outside. Which code may call an entity's write methods is ModuleArchitectureTest's job.
 *
 * <p>A rule wrapped in {@link FreezingArchRule} was added while older code still broke it: those violations are
 * recorded in src/test/resources/archunit_store and tolerated, any new one fails. The store shrinks as the code is
 * fixed; commit its change together with the fix.
 */
@AnalyzeClasses(
        packages = "com.moonkage.identity",
        importOptions = {ImportOption.DoNotIncludeTests.class, ImportOption.DoNotIncludeJars.class})
class DomainModelArchitectureTest {

    private static final String BASE_PACKAGE = "com.moonkage.identity";

    /** Besides its own component, what an entity or embeddable may use. */
    private static final List<String> DOMAIN_PACKAGES = List.of(
            "java",
            "jakarta.persistence",
            "org.hibernate.annotations",
            "lombok",
            // the common language and the mapped superclass of every table (plan v2 4.1, 6)
            BASE_PACKAGE + ".shared",
            BASE_PACKAGE + ".platform.persistence",
            "com.moonkage.reference");

    @ArchTest
    static final ArchRule ENTITIES_HAVE_NO_PUBLIC_CONSTRUCTOR = constructors()
            .that()
            .areDeclaredInClassesThat()
            .areAnnotatedWith(Entity.class)
            .should()
            .notBePublic()
            .because("an entity is created by its static factory, which checks every field (principle 2)");

    @ArchTest
    static final ArchRule ENTITIES_KEEP_A_PROTECTED_CONSTRUCTOR_FOR_JPA = constructors()
            .that()
            .areDeclaredInClassesThat()
            .areAnnotatedWith(Entity.class)
            .and(DescribedPredicate.describe(
                    "have no parameters",
                    (JavaConstructor c) -> c.getRawParameterTypes().isEmpty()))
            .should()
            .beProtected()
            .because("JPA needs a no-argument constructor; nothing else may use it (ST-02)");

    @ArchTest
    static final ArchRule ENTITIES_HAVE_NO_BUILDER = noClasses()
            .that()
            .areAnnotatedWith(Entity.class)
            .should()
            .dependOnClassesThat()
            .haveSimpleNameEndingWith("Builder")
            .because("a builder sets fields one by one and skips the entity's checks (principle 2)");

    @ArchTest
    static final ArchRule ENTITIES_DEPEND_ONLY_ON_THE_DOMAIN = classes()
            .that(annotatedWith(Entity.class)
                    .or(annotatedWith(Embeddable.class))
                    .or(annotatedWith(MappedSuperclass.class)))
            .should(dependOnlyOnTheDomainOrTheirComponent())
            .because("entities hold behaviour on their own data only: no service, repository, DTO or framework");

    @ArchTest
    static final ArchRule ENTITIES_DO_NOT_DEPEND_ON_SPRING_SECURITY = noClasses()
            .that()
            .areAnnotatedWith(Entity.class)
            .should()
            .dependOnClassesThat()
            .resideInAPackage("org.springframework.security..")
            .because("an entity is data of the domain, not a Spring Security principal");

    /** Frozen: ApiResponse still stamps its own time; the two calls are recorded in the store. */
    @ArchTest
    static final ArchRule TIME_COMES_FROM_THE_CLOCK_BEAN = FreezingArchRule.freeze(noClasses()
            .that()
            .doNotHaveSimpleName("ClockConfig")
            .should()
            .callMethodWhere(DescribedPredicate.describe(
                    "the target reads the system clock (java.time now() without a Clock)",
                    (JavaMethodCall call) ->
                            call.getTarget().getOwner().getPackageName().equals("java.time")
                                    && call.getTarget().getName().equals("now")
                                    && call.getTarget().getRawParameterTypes().stream()
                                            .noneMatch(type -> type.isEquivalentTo(Clock.class))))
            .because("services take the time from the Clock bean and pass it in, so tests can fix it (TS-01)"));

    private static ArchCondition<JavaClass> dependOnlyOnTheDomainOrTheirComponent() {
        return new ArchCondition<>("depend only on " + DOMAIN_PACKAGES + " or their own component") {
            @Override
            public void check(JavaClass item, ConditionEvents events) {
                String component = componentOf(item.getPackageName());
                for (Dependency dependency : item.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass().getBaseComponentType();
                    if (!target.isPrimitive() && !isAllowed(target.getPackageName(), component)) {
                        events.add(SimpleConditionEvent.violated(dependency, dependency.getDescription()));
                    }
                }
            }
        };
    }

    /** com.moonkage.identity.nfc.domain → com.moonkage.identity.nfc */
    private static String componentOf(String packageName) {
        String rest = packageName.substring(BASE_PACKAGE.length() + 1);
        int dot = rest.indexOf('.');
        return BASE_PACKAGE + "." + (dot < 0 ? rest : rest.substring(0, dot));
    }

    private static boolean isAllowed(String packageName, String component) {
        return isInside(packageName, component) || DOMAIN_PACKAGES.stream().anyMatch(p -> isInside(packageName, p));
    }

    private static boolean isInside(String packageName, String parent) {
        return packageName.equals(parent) || packageName.startsWith(parent + ".");
    }
}
