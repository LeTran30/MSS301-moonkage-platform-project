package com.moonkage.identity;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.core.ApplicationModule;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Module boundaries as Spring Modulith sees them (plan v2, 3.1 and 8.2). Report mode until phase 9: the old
 * components still break the rules, so violations are logged, not failed. Phase 9 replaces this with
 * {@code ApplicationModules.of(...).verify()}.
 */
class ModulithStructureTest {

    private static final Logger log = LoggerFactory.getLogger(ModulithStructureTest.class);

    private static final ApplicationModules MODULES = ApplicationModules.of(IdentityServiceApplication.class);

    @Test
    void foundationModulesExist() {
        List<String> names = MODULES.stream()
                .map(ApplicationModule::getIdentifier)
                .map(Object::toString)
                .toList();
        assertTrue(names.containsAll(List.of("shared", "platform")), names::toString);
    }

    @Test
    void reportViolations() {
        String report = MODULES.detectViolations().getMessage();
        log.info(
                "Spring Modulith report (not enforced before phase 9):\n{}",
                report.isBlank() ? "no violation" : report);
    }
}
