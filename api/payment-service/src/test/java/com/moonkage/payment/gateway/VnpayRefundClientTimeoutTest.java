package com.moonkage.payment.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.moonkage.payment.config.VnpayProperties;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

/**
 * Lần gọi VNPay phải có thời hạn (AC-49.3).
 *
 * <p>Vì sao cần: lần gọi hoàn tiền nằm trong {@code RefundJob} — một tác vụ định
 * kỳ chạy trên thread của scheduler. Một client HTTP không có timeout có thể treo
 * vô hạn, và thread đó thì dùng chung với relay outbox (mặc định của Spring Boot
 * là **một** thread cho mọi {@code @Scheduled}). Treo ở đây ⇒ sự kiện của đơn không
 * đi nữa ⇒ đơn không bao giờ sang {@code PAID}. Đó đúng là lỗi đã làm CI đỏ ở
 * luồng khiếu nại.
 *
 * <p>Test dùng một cổng TCP không trả lời: kết nối mở nhưng không có phản hồi
 * HTTP nào — đúng hình dạng của một sandbox chậm.
 */
class VnpayRefundClientTimeoutTest {

    /**
     * Mở một cổng TCP nhận kết nối nhưng không bao giờ trả lời — mô phỏng một VNPay
     * sandbox treo. Cổng giữ mở cho tới khi JVM kết thúc.
     */
    private static int openBlackHole() throws IOException {
        ServerSocket server = new ServerSocket(0);
        Thread accepter = new Thread(() -> {
            while (!server.isClosed()) {
                try {
                    // Giữ kết nối mở, không đọc cũng không ghi: phía nhận im lặng.
                    Socket accepted = server.accept();
                    accepted.setKeepAlive(true);
                } catch (IOException e) {
                    return;
                }
            }
        });
        accepter.setDaemon(true);
        accepter.start();
        return server.getLocalPort();
    }

    private static VnpayProperties properties(String apiUrl) {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMN");
        properties.setHashSecret("SECRET123");
        properties.setReturnUrl("http://localhost:5173/thanh-toan/ket-qua");
        properties.setApiUrl(apiUrl);
        properties.setRefundTimeout(Duration.ofMillis(300));
        return properties;
    }

    @Test
    @DisplayName("VNPay không trả lời thì lần gọi hoàn tiền hỏng sau thời hạn, không treo")
    void aSilentGatewayFailsInsteadOfHanging() throws Exception {
        int port = openBlackHole();
        VnpayRefundClient client = new VnpayRefundClient(properties("http://127.0.0.1:" + port), RestClient.builder());

        long started = System.nanoTime();
        VnpayRefundClient.RefundResult result =
                client.refund("txn-1", "txn-no-1", Instant.now(), 100_000L, 50_000L, "system");
        Duration elapsed = Duration.ofNanos(System.nanoTime() - started);

        assertThat(result.success()).isFalse();
        assertThat(result.error()).contains("unreachable");
        // Không treo: lời gọi phải quay về trong khoảng thời hạn đã đặt (cộng chút độ trễ cho máy chậm).
        assertThat(elapsed).isLessThan(Duration.ofSeconds(10));
    }

    @Test
    @DisplayName("chưa cấu hình VNPay thì không gọi ra ngoài, coi như hoàn tiền hỏng")
    void anUnconfiguredGatewayIsNeverCalled() {
        VnpayProperties properties = new VnpayProperties();
        properties.setRefundTimeout(Duration.ofMillis(300));
        VnpayRefundClient client = new VnpayRefundClient(properties, RestClient.builder());

        VnpayRefundClient.RefundResult result =
                client.refund("txn-1", "txn-no-1", Instant.now(), 100_000L, 50_000L, "system");

        assertThat(result.success()).isFalse();
        assertThat(result.error()).contains("not configured");
    }
}
