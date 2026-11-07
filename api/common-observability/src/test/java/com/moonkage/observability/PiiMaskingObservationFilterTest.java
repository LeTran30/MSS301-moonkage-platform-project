package com.moonkage.observability;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import org.junit.jupiter.api.Test;

/**
 * BE-11: a span is kept for days in the collector, so it must not carry the personal data a log line is allowed to
 * carry. The filter masks the key values of an observation before the tracing handler puts them on the span.
 */
class PiiMaskingObservationFilterTest {

    private final PiiMaskingObservationFilter filter = new PiiMaskingObservationFilter();

    @Test
    void anEmailKeyIsMasked() {
        assertThat(PiiMaskingObservationFilter.mask("email", "lien@example.com"))
                .isEqualTo("l***n@example.com");
    }

    @Test
    void aPhoneKeyIsMasked() {
        assertThat(PiiMaskingObservationFilter.mask("phone", "0912345678")).isEqualTo("091****678");
    }

    @Test
    void aSecretKeyIsNeverRecorded() {
        assertThat(PiiMaskingObservationFilter.mask("password", "hunter2")).isEqualTo("[secret]");
        assertThat(PiiMaskingObservationFilter.mask("authorization", "Bearer abc"))
                .isEqualTo("[secret]");
    }

    @Test
    void anIdNumberKeyIsNeverRecorded() {
        assertThat(PiiMaskingObservationFilter.mask("id_number", "012345678901"))
                .isEqualTo("[redacted]");
    }

    @Test
    void aValueThatIsAnEmailIsMaskedEvenWhenTheKeySaysNothing() {
        assertThat(PiiMaskingObservationFilter.mask("customer.contact", "lien@example.com"))
                .isEqualTo("l***n@example.com");
    }

    @Test
    void aValueThatIsAPhoneIsMaskedEvenWhenTheKeySaysNothing() {
        assertThat(PiiMaskingObservationFilter.mask("customer.contact", "0912345678"))
                .isEqualTo("091****678");
    }

    @Test
    void aValueThatHoldsNoPersonalDataIsLeftAlone() {
        assertThat(PiiMaskingObservationFilter.mask("http.route", "/api/orders"))
                .isEqualTo("/api/orders");
        assertThat(PiiMaskingObservationFilter.mask("method", "GET")).isEqualTo("GET");
    }

    @Test
    void theQueryStringOfAUrlIsMaskedParameterByParameter() {
        String masked =
                PiiMaskingObservationFilter.mask("http.url", "http://host/api/orders?email=lien@example.com&page=2");

        assertThat(masked).isEqualTo("http://host/api/orders?email=l***n@example.com&page=2");
    }

    @Test
    void aUrlWithoutAQueryStringIsLeftAlone() {
        assertThat(PiiMaskingObservationFilter.mask("http.url", "http://host/api/orders"))
                .isEqualTo("http://host/api/orders");
    }

    @Test
    void theFullUrlOfTheGatewayIsMaskedAndKeepsItsPath() {
        String masked = PiiMaskingObservationFilter.mask(
                "http.uri", "http://localhost:8080/api/products?email=lien@example.com&phone=0912345678");

        assertThat(masked).isEqualTo("http://localhost:8080/api/products?email=l***n@example.com&phone=091****678");
    }

    @Test
    void aUrlWhoseValueHoldsAPhoneNumberIsMaskedAsAPhoneNumber() {
        assertThat(PiiMaskingObservationFilter.mask("http.uri", "0912345678")).isEqualTo("091****678");
    }

    @Test
    void aUrlIsNotMistakenForAnEmailAddress() {
        // the value holds a dot in the domain, but the rest of it is a URL: masking it as one e-mail address
        // would hide the path and leave the rest of the query string readable
        String masked = PiiMaskingObservationFilter.mask("http.uri", "http://localhost:8080/api/products?page=1");

        assertThat(masked).isEqualTo("http://localhost:8080/api/products?page=1");
    }

    @Test
    void theFilterMasksTheKeyValuesOfTheContext() {
        Observation.Context context = new Observation.Context();
        context.addHighCardinalityKeyValue(KeyValue.of("email", "lien@example.com"));
        context.addLowCardinalityKeyValue(KeyValue.of("http.route", "/api/orders"));

        filter.map(context);

        assertThat(context.getHighCardinalityKeyValue("email").getValue()).isEqualTo("l***n@example.com");
        assertThat(context.getLowCardinalityKeyValue("http.route").getValue()).isEqualTo("/api/orders");
    }

    @Test
    void theFilterKeepsTheCardinalityOfTheKeyItMasks() {
        Observation.Context context = new Observation.Context();
        context.addLowCardinalityKeyValue(KeyValue.of("phone", "0912345678"));

        filter.map(context);

        assertThat(context.getLowCardinalityKeyValue("phone").getValue()).isEqualTo("091****678");
        assertThat(context.getHighCardinalityKeyValue("phone")).isNull();
    }
}
