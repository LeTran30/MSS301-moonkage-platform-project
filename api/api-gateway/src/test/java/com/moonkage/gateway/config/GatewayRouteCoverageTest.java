package com.moonkage.gateway.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.util.pattern.PathPatternParser;
import org.yaml.snakeyaml.Yaml;

/**
 * D-30: every aggregate root is reachable on its canonical path through the gateway.
 *
 * <p>Each service is routed by the aggregate root it owns ({@code /api/orders}, {@code /api/vendors}, ...). The gateway
 * is the only public entry point, so a service endpoint that no route covers is unreachable for the web app and for the
 * mobile app. This test reads the real {@code application.yml} of the gateway and the real controllers of every
 * service, then fails when an endpoint has no route or when a route points at the wrong service.
 */
class GatewayRouteCoverageTest {
    /**
     * The modules that own a public HTTP contract. The internal controllers ({@code /internal/**}) are not routed on
     * purpose.
     */
    private static final List<String> PUBLIC_SERVICES = List.of(
            "identity-service",
            "catalog-service",
            "quotation-service",
            "order-service",
            "vendor-service",
            "payment-service",
            "orchestrator-service");

    private static final Pattern CLASS_MAPPING =
            Pattern.compile("@RequestMapping\\(\\s*(?:value\\s*=\\s*)?\"([^\"]+)\"");
    private static final Pattern METHOD_MAPPING =
            Pattern.compile("@(Get|Post|Put|Patch|Delete)Mapping(?:\\(\\s*(?:value\\s*=\\s*)?\"([^\"]*)\")?");

    @Test
    @DisplayName("Mọi endpoint public của mọi service đều đi qua được một route của gateway")
    void everyPublicEndpointIsCoveredByARoute() throws IOException {
        List<Route> routes = readRoutes();
        Map<String, List<Endpoint>> endpoints = readPublicEndpoints();

        assertThat(routes).as("phải đọc được các route trong application.yml").isNotEmpty();
        assertThat(endpoints).as("phải đọc được controller của các service").isNotEmpty();

        List<String> problems = new ArrayList<>();
        for (Map.Entry<String, List<Endpoint>> service : endpoints.entrySet()) {
            for (Endpoint endpoint : service.getValue()) {
                Route route = match(routes, endpoint.path());
                if (route == null) {
                    problems.add(
                            service.getKey() + " " + endpoint.verb() + " " + endpoint.path() + " không có route nào");
                } else if (!route.target().equals(service.getKey())) {
                    problems.add(service.getKey() + " " + endpoint.verb() + " " + endpoint.path() + " bị route "
                            + route.id() + " trỏ sang " + route.target());
                }
            }
        }

        assertThat(problems)
                .as("gateway phải phủ hết endpoint public của mọi service")
                .isEmpty();
    }

    @Test
    @DisplayName("Mỗi route trỏ vào một service đã biết và mỗi service đều có route")
    void everyRouteTargetsAKnownServiceAndEveryServiceIsRouted() throws IOException {
        List<Route> routes = readRoutes();

        Set<String> targets = new LinkedHashSet<>();
        for (Route route : routes) {
            targets.add(route.target());
        }
        assertThat(targets)
                .as("mỗi route phải trỏ vào một service đã biết")
                .isSubsetOf(new LinkedHashSet<>(PUBLIC_SERVICES));
        assertThat(targets)
                .as("mọi service có hợp đồng public đều phải có route")
                .containsAll(PUBLIC_SERVICES);
    }

    @Test
    @DisplayName("Route id phải là duy nhất")
    void routeIdsAreUnique() throws IOException {
        List<Route> routes = readRoutes();
        Set<String> ids = new LinkedHashSet<>();
        for (Route route : routes) {
            assertThat(ids.add(route.id()))
                    .as("route id phải là duy nhất: " + route.id())
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Path dạng /** của gateway khớp cả với gốc trần")
    void wildcardAlsoMatchesTheBareRoot() {
        // Documents the real semantics of the gateway, so nobody "fixes" the routes by removing the bare form.
        assertThat(new PathPatternParser()
                        .parse("/api/vendors/**")
                        .matches(org.springframework.http.server.PathContainer.parsePath("/api/vendors")))
                .isTrue();
    }

    private record Endpoint(String verb, String path) {}

    private record Route(String id, String target, List<String> paths) {}

    private static Route match(List<Route> routes, String path) {
        for (Route route : routes) {
            for (String pattern : route.paths()) {
                if (matches(pattern, path)) {
                    return route;
                }
            }
        }
        return null;
    }

    /** The gateway semantics: {@code /a/**} covers {@code /a}, {@code /a/} and everything below {@code /a}. */
    private static boolean matches(String pattern, String path) {
        if (!pattern.endsWith("/**")) {
            return pattern.equals(path);
        }
        String base = pattern.substring(0, pattern.length() - 3);
        return path.equals(base) || path.startsWith(base + "/");
    }

    private Map<String, List<Endpoint>> readPublicEndpoints() throws IOException {
        Path apiRoot = Path.of("..").toAbsolutePath().normalize();
        Map<String, List<Endpoint>> result = new LinkedHashMap<>();
        for (String service : PUBLIC_SERVICES) {
            Path controllerRoot = apiRoot.resolve(service).resolve("src/main/java");
            if (!Files.isDirectory(controllerRoot)) {
                continue;
            }
            List<Endpoint> endpoints = new ArrayList<>();
            try (Stream<Path> files = Files.walk(controllerRoot)) {
                for (Path file : files.filter(p -> p.toString().endsWith("Controller.java"))
                        .toList()) {
                    endpoints.addAll(readEndpoints(file));
                }
            }
            result.put(service, endpoints);
        }
        return result;
    }

    private List<Endpoint> readEndpoints(Path file) throws IOException {
        String source = Files.readString(file, StandardCharsets.UTF_8);
        if (!source.contains("@RestController")) {
            return List.of();
        }
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        String classPrefix = null;
        for (String line : lines) {
            Matcher matcher = CLASS_MAPPING.matcher(line);
            if (matcher.find()) {
                classPrefix = matcher.group(1);
                break;
            }
        }
        List<Endpoint> endpoints = new ArrayList<>();
        for (String line : lines) {
            Matcher matcher = METHOD_MAPPING.matcher(line);
            if (!matcher.find()) {
                continue;
            }
            String sub = matcher.group(2) == null ? "" : matcher.group(2);
            String path = (classPrefix == null ? "" : classPrefix) + sub;
            if (path.startsWith("/internal")) {
                continue;
            }
            endpoints.add(new Endpoint(matcher.group(1).toUpperCase(Locale.ROOT), path.isEmpty() ? "/" : path));
        }
        return endpoints;
    }

    @SuppressWarnings("unchecked")
    private List<Route> readRoutes() throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/application.yml")) {
            assertThat(in)
                    .as("application.yml phải nằm trong classpath của gateway")
                    .isNotNull();
            Map<String, Object> root = new Yaml().load(new String(in.readAllBytes(), StandardCharsets.UTF_8));

            Map<String, Object> gateway = descend(root, "spring", "cloud", "gateway", "server", "webflux");
            Object rawRoutes = gateway.get("routes");
            assertThat(rawRoutes)
                    .as("spring.cloud.gateway.server.webflux.routes phải tồn tại")
                    .isInstanceOf(List.class);

            List<Route> result = new ArrayList<>();
            for (Object raw : (List<Object>) rawRoutes) {
                if (!(raw instanceof Map)) {
                    continue;
                }
                Map<String, Object> route = (Map<String, Object>) raw;
                result.add(new Route(
                        String.valueOf(route.get("id")),
                        readTarget(String.valueOf(route.get("uri"))),
                        readPatterns(route.get("predicates"))));
            }
            return result;
        }
    }

    /**
     * The service behind a route: {@code lb://vendor-service} and {@code lb:ws://vendor-service} both name the service.
     */
    private static String readTarget(String uri) {
        int schemeEnd = uri.indexOf("://");
        return schemeEnd < 0 ? uri : uri.substring(schemeEnd + 3);
    }

    private static List<String> readPatterns(Object predicates) {
        List<String> patterns = new ArrayList<>();
        if (!(predicates instanceof List)) {
            return patterns;
        }
        for (Object predicate : (List<Object>) predicates) {
            String text = String.valueOf(predicate);
            if (!text.startsWith("Path=")) {
                continue;
            }
            for (String part : text.substring("Path=".length()).split(",", -1)) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    patterns.add(trimmed);
                }
            }
        }
        return patterns;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> descend(Map<String, Object> root, String... keys) {
        Map<String, Object> current = root;
        for (String key : keys) {
            Object next = current.get(key);
            assertThat(next).as("thiếu khoá cấu hình " + String.join(".", keys)).isInstanceOf(Map.class);
            current = (Map<String, Object>) next;
        }
        return current;
    }
}
