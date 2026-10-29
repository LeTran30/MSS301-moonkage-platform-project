package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Approved snapshots of what identity-service answers (plan v2, section 8.1). A snapshot is the status and the whole
 * JSON body; only values that change from run to run are replaced by {@code "<masked>"}, so their presence and
 * nullness still count. Run with {@code -Dcontract.record=true} to (re)write snapshots, then review the diff: a
 * changed snapshot is a changed contract.
 */
final class Golden {

    static final String MASK = "<masked>";

    /** Values generated per run: ids, tokens, clocks, OTP codes. Everything else is compared as is. */
    private static final Set<String> VOLATILE_KEYS = Set.of(
            "timestamp",
            "token",
            "refreshToken",
            "id",
            "accountId",
            "sessionId",
            "eventId",
            "createdAt",
            "updatedAt",
            "expiresAt",
            "lockedUntil",
            "occurredAt",
            "nfcVerifiedAt",
            "otp");

    /** Ids inside text, e.g. the {@code path} of an error answer. */
    private static final Pattern UUID_IN_TEXT =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private static final Path ROOT = Path.of("src", "test", "resources", "contract");
    private static final boolean RECORD = Boolean.getBoolean("contract.record");
    private static final ObjectMapper JSON = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private Golden() {}

    /** Compares one HTTP answer with {@code contract/<name>.json}. */
    static void assertResponse(String name, int status, String body) {
        ObjectNode actual = JSON.createObjectNode();
        actual.put("status", status);
        actual.set("body", body.isBlank() ? null : normalize(read(body)));
        assertSnapshot(name, actual);
    }

    /**
     * Compares one published message (routing key, content type, body) with {@code contract/<name>.json}. The
     * {@code __TypeId__} header is left out: orchestrator-service picks the class from its listener, not the header.
     */
    static void assertEvent(String name, EventInbox.Event event) {
        ObjectNode actual = JSON.createObjectNode();
        actual.put("routingKey", event.routingKey());
        actual.put("contentType", event.contentType());
        actual.set("body", normalize(read(event.body())));
        assertSnapshot(name, actual);
    }

    static JsonNode read(String json) {
        try {
            return JSON.readTree(json);
        } catch (IOException e) {
            throw new UncheckedIOException("not JSON: " + json, e);
        }
    }

    private static void assertSnapshot(String name, JsonNode actual) {
        Path file = ROOT.resolve(name + ".json");
        try {
            if (RECORD) {
                Files.createDirectories(file.getParent());
                Files.writeString(file, JSON.writeValueAsString(actual) + "\n", StandardCharsets.UTF_8);
                return;
            }
            if (!Files.exists(file)) {
                fail("no approved snapshot " + file + "; run with -Dcontract.record=true and review it. Actual:\n"
                        + JSON.writeValueAsString(actual));
            }
            JsonNode expected = JSON.readTree(Files.readString(file, StandardCharsets.UTF_8));
            Path actualFile = file.resolveSibling(file.getFileName().toString().replace(".json", ".actual.json"));
            if (expected.equals(actual)) {
                Files.deleteIfExists(actualFile);
                return;
            }
            // kept next to the snapshot for a diff; ignored by git
            Files.writeString(actualFile, JSON.writeValueAsString(actual) + "\n", StandardCharsets.UTF_8);
            assertEquals(
                    JSON.writeValueAsString(expected), JSON.writeValueAsString(actual), "contract changed: " + file);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** NFC session ids are random text, not UUIDs. */
    private static final Pattern SESSION_IN_PATH = Pattern.compile("/sessions/[^/]+");

    /** Time left in the messages of OTP_TOO_FREQUENT, OTP_MAX_ATTEMPTS_EXCEEDED and NFC_LOCKED: real clock. */
    private static final Pattern TIME_LEFT = Pattern.compile("(sau |đợi )\\d+( phút| giây)");

    private static String maskIds(String text) {
        String masked = UUID_IN_TEXT.matcher(text).replaceAll(MASK);
        masked = TIME_LEFT.matcher(masked).replaceAll("$1" + MASK + "$2");
        return SESSION_IN_PATH.matcher(masked).replaceAll("/sessions/" + MASK);
    }

    /** Masks volatile values; sorts {@code errors[]} because validation reports fields in no fixed order. */
    private static JsonNode normalize(JsonNode node) {
        if (node instanceof ObjectNode object) {
            Iterator<Map.Entry<String, JsonNode>> fields = object.fields();
            List<Map.Entry<String, JsonNode>> entries = new ArrayList<>();
            fields.forEachRemaining(entries::add);
            for (Map.Entry<String, JsonNode> field : entries) {
                JsonNode value = field.getValue();
                if (VOLATILE_KEYS.contains(field.getKey()) && !value.isNull()) {
                    object.set(field.getKey(), TextNode.valueOf(MASK));
                } else if (value.isTextual()) {
                    object.set(field.getKey(), TextNode.valueOf(maskIds(value.asText())));
                } else {
                    object.set(field.getKey(), normalize(value));
                }
            }
            if (object.get("errors") instanceof ArrayNode errors) {
                List<JsonNode> sorted = new ArrayList<>();
                errors.forEach(sorted::add);
                sorted.sort(Comparator.comparing(JsonNode::toString));
                errors.removeAll();
                errors.addAll(sorted);
            }
        } else if (node instanceof ArrayNode array) {
            for (int i = 0; i < array.size(); i++) {
                array.set(i, normalize(array.get(i)));
            }
        }
        return node;
    }
}
