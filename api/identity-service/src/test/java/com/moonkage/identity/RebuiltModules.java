package com.moonkage.identity;

import java.util.Arrays;
import java.util.List;

/**
 * The modules already rebuilt on plan v2's layout (3.4). ModuleArchitectureTest holds them to the new rules; the
 * older component rules skip them. Each phase adds its modules; phase 9 lists them all and drops the old rules.
 */
final class RebuiltModules {

    static final String BASE_PACKAGE = "com.moonkage.identity";

    static final List<String> NAMES = List.of("account", "otp", "auth");

    private RebuiltModules() {}

    /** {@code com.moonkage.identity.account..} and so on, for ArchUnit package matching. */
    static String[] packagePatterns() {
        return NAMES.stream().map(name -> BASE_PACKAGE + "." + name + "..").toArray(String[]::new);
    }

    static boolean contains(String packageName) {
        return Arrays.stream(packagePatterns())
                .map(pattern -> pattern.substring(0, pattern.length() - 2))
                .anyMatch(module -> packageName.equals(module) || packageName.startsWith(module + "."));
    }
}
