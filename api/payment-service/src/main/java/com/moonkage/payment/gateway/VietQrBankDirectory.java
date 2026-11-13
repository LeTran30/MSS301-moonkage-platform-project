package com.moonkage.payment.gateway;

import com.moonkage.payment.dto.response.BankResponse;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * The Vietnamese banks a buyer can withdraw to, from the public VietQR list (api.vietqr.io/v2/banks). The list rarely
 * changes, so it is kept for a day; when VietQR is down the last list is served, or WALLET_003 before the first one.
 */
@Slf4j
@Component
public class VietQrBankDirectory {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final Duration KEEP = Duration.ofDays(1);

    private final RestClient restClient;
    private final String url;
    private volatile List<BankResponse> banks = List.of();
    private volatile Instant fetchedAt = Instant.EPOCH;

    @Autowired
    public VietQrBankDirectory(
            RestClient.Builder restClientBuilder,
            @Value("${moonkage.wallet.bank-list-url:https://api.vietqr.io/v2/banks}") String url) {
        this(restClientBuilder.requestFactory(timeoutFactory()).build(), url);
    }

    /** A client given as it is (tests bind it to a mock server). */
    VietQrBankDirectory(RestClient restClient, String url) {
        this.restClient = restClient;
        this.url = url;
    }

    /** Explicit timeouts: a bank list must never hang a withdrawal page. */
    private static JdkClientHttpRequestFactory timeoutFactory() {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(TIMEOUT);
        return requestFactory;
    }

    public List<BankResponse> banks() {
        if (fetchedAt.plus(KEEP).isAfter(Instant.now()) && !banks.isEmpty()) {
            return banks;
        }
        try {
            VietQrAnswer answer = restClient.get().uri(url).retrieve().body(VietQrAnswer.class);
            if (answer != null && answer.data() != null && !answer.data().isEmpty()) {
                banks = answer.data().stream()
                        .map(b -> new BankResponse(b.bin(), b.shortName(), b.name()))
                        .toList();
                fetchedAt = Instant.now();
            }
        } catch (RestClientException e) {
            log.warn("VietQR bank list unavailable: {}", e.getMessage());
        }
        if (banks.isEmpty()) {
            throw new AppException(ErrorCode.BANK_LIST_UNAVAILABLE);
        }
        return banks;
    }

    /** The part of VietQR's answer that is used. */
    record VietQrAnswer(List<Bank> data) {

        record Bank(String bin, String shortName, String name) {}
    }
}
