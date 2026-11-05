package com.moonkage.gateway.config;

import java.net.URI;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * The legacy paths that carry the name of the service answer with a permanent redirect to the canonical path (D-30).
 *
 * <p>Decision D-18 fixed the public path of a resource as {@code /api/<resource>/...}, without the name of the
 * service. The gateway still routes by the name of the service for some services, because their canonical path is
 * not served yet - see {@code application.yml}. D-30 asks for the old path to answer {@code 301} for one release
 * before {@code discovery.locator} is turned off, so that a client that still calls the old form (the mobile app
 * lives outside this repository) is sent to the new one instead of breaking.
 *
 * <p>Only the paths whose canonical form is <em>actually served</em> are redirected. A path whose canonical form has
 * no route yet would be redirected into a 404, which is worse than the answer it replaces - so those keep working
 * through the discovery locator until they are migrated.
 *
 * <p>Why {@code 308} and not {@code 301}: the old form is called with methods other than GET (a client replaces the
 * fee table with {@code PUT}), and a {@code 301} makes a browser turn the call into a GET and drop the body. A
 * {@code 308} keeps the method and the body, so the redirect is transparent to the caller.
 *
 * <p>Why it is a {@link WebFilter} and not a gateway {@code GlobalFilter}: the answer of a redirect has to be the
 * first thing the caller sees. A gateway filter runs after the Spring Security chain, so a legacy path that needs a
 * token (the fee table with {@code PUT} is admin only) would be answered with a {@code 403} before it ever reaches
 * the redirect. A web filter with the highest precedence answers the redirect before the security chain, so the
 * caller is sent to the canonical path and the authorization happens there, on the canonical path.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LegacyPathRedirectFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(LegacyPathRedirectFilter.class);

    /**
     * The legacy prefixes that are redirected, and the canonical prefix each of them becomes.
     *
     * <p>Every entry names a service whose canonical path the gateway already serves (the routes of
     * {@code application.yml}), so the redirect never leads to a path nothing serves. The services whose canonical
     * path is not served yet - identity, quotation, order and payment - are deliberately absent: their old form
     * keeps working through the discovery locator.
     */
    private static final List<Redirect> REDIRECTS = List.of(
            new Redirect("/catalog-service/api/products", "/api/products"),
            new Redirect("/catalog-service/api/interprovince-fees", "/api/interprovince-fees"),
            new Redirect("/vendor-service/api/vendors", "/api/vendors"),
            new Redirect("/vendor-service/api/registration-fee-config", "/api/registration-fee-config"),
            new Redirect("/vendor-service/api/cake-attributes", "/api/cake-attributes"),
            new Redirect("/orchestrator-service/api/notifications", "/api/notifications"));

    /** The longest prefix first, so the most specific one wins when two of them could match. */
    private static final List<Redirect> BY_LENGTH = REDIRECTS.stream()
            .sorted(Comparator.comparingInt((Redirect r) -> r.legacy().length()).reversed())
            .toList();

    private final CorsProperties corsProperties;

    public LegacyPathRedirectFilter(CorsProperties corsProperties) {
        this.corsProperties = corsProperties;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // A preflight (OPTIONS) is not a call: the browser asks whether the real call may be made. Answering it with
        // a redirect would make the browser follow the redirect and read the CORS headers of the answer instead of
        // the ones of the preflight, so the preflight is left to the gateway's CORS handling.
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }
        URI uri = exchange.getRequest().getURI();
        String path = uri.getPath();
        Redirect redirect = BY_LENGTH.stream()
                .filter(candidate -> candidate.matches(path))
                .findFirst()
                .orElse(null);
        if (redirect == null) {
            return chain.filter(exchange);
        }
        String target = redirect.canonical() + path.substring(redirect.legacy().length());
        if (uri.getRawQuery() != null) {
            target = target + "?" + uri.getRawQuery();
        }
        log.info("Legacy path {} answered with a redirect to {}", path, target);
        return respondWithRedirect(exchange, target);
    }

    /**
     * The answer of the redirect: the status, the new location and the CORS header of the origin.
     *
     * <p>The origin is echoed only when it is one of the origins the gateway accepts, so the redirect does not open
     * the gateway to an origin the CORS configuration refuses. The {@code Vary} header is set on the answer because
     * the CORS filter of the gateway does not run on a response that never reached it.
     */
    private Mono<Void> respondWithRedirect(ServerWebExchange exchange, String target) {
        var response = exchange.getResponse();
        response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
        response.getHeaders().set(HttpHeaders.LOCATION, target);
        String origin = exchange.getRequest().getHeaders().getFirst(HttpHeaders.ORIGIN);
        if (origin != null && corsProperties.allowedOrigins().contains(origin)) {
            response.getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            response.getHeaders().set(HttpHeaders.VARY, HttpHeaders.ORIGIN);
        }
        return response.setComplete();
    }

    /**
     * One pair of paths: the legacy prefix and the canonical prefix it becomes.
     *
     * @param legacy the prefix the caller uses today, e.g. {@code /catalog-service/api/products}
     * @param canonical the prefix the gateway serves, e.g. {@code /api/products}
     */
    private record Redirect(String legacy, String canonical) {
        /** True when the path is the prefix itself or a path below it. */
        boolean matches(String path) {
            return path.equals(legacy) || path.startsWith(legacy + "/");
        }
    }
}
