package com.bake2b.gateway.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Loads the repo-root .env into System properties so application.properties can read ${VAR}.
 * Call loadDotEnv() in main() before SpringApplication.run().
 * Real environment variables / -D properties win over .env (useful for Docker / CI).
 */
public final class DotEnvConfig {

    private static final Logger log = LoggerFactory.getLogger(DotEnvConfig.class);
    private static final String ENV_FILE = ".env";

    private DotEnvConfig() {}

    public static void loadDotEnv() {
        try {
            Path envFile = findEnvFile();
            if (envFile == null) {
                log.warn(
                        "File .env not found from {} upwards. Using system environment variables.",
                        Paths.get("").toAbsolutePath());
                return;
            }
            Map<String, String> envVars = parseEnvFile(envFile);
            envVars.forEach((key, value) -> {
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            });
            log.info("Loaded {} variables from {}", envVars.size(), envFile.toAbsolutePath());
        } catch (IOException e) {
            log.error("Error loading .env file", e);
        }
    }

    /**
     * Walks up from the working dir, so it works whether the service runs from its module,
     * backend/ or the repo root.
     */
    private static Path findEnvFile() {
        for (Path dir = Paths.get("").toAbsolutePath(); dir != null; dir = dir.getParent()) {
            Path candidate = dir.resolve(ENV_FILE);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static Map<String, String> parseEnvFile(Path envFile) throws IOException {
        Map<String, String> out = new LinkedHashMap<>();
        List<String> lines = Files.readAllLines(envFile, StandardCharsets.UTF_8);
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            int eq = line.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = line.substring(0, eq).trim();
            String value = line.substring(eq + 1).trim();
            if (value.length() >= 2
                    && ((value.startsWith("\"") && value.endsWith("\""))
                            || (value.startsWith("'") && value.endsWith("'")))) {
                value = value.substring(1, value.length() - 1);
            }
            out.put(key, value); // empty values are kept so optional vars (MAIL_HOST=) still resolve
        }
        return out;
    }
}
