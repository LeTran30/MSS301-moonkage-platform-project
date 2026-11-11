package com.moonkage.payment.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** The bank list of a withdrawal: read from VietQR once a day, never an empty list served. */
class VietQrBankDirectoryTest {

    private static final String URL = "https://vietqr.test/v2/banks";
    private static final String ANSWER = """
            {"code":"00","data":[{"id":17,"bin":"970436","shortName":"Vietcombank","name":"Ngân hàng Ngoại thương",
            "logo":"x","transferSupported":1}]}""";

    @Test
    void theListIsReadOnceAndKept() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(URL)).andRespond(withSuccess(ANSWER, MediaType.APPLICATION_JSON));
        VietQrBankDirectory directory = new VietQrBankDirectory(builder.build(), URL);

        assertEquals("970436", directory.banks().getFirst().bin());
        assertEquals("Vietcombank", directory.banks().getFirst().shortName());
        server.verify();
    }

    @Test
    void withoutAnyListYetItSaysSo() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(URL)).andRespond(withServerError());
        VietQrBankDirectory directory = new VietQrBankDirectory(builder.build(), URL);

        AppException error = assertThrows(AppException.class, directory::banks);

        assertEquals(ErrorCode.BANK_LIST_UNAVAILABLE, error.getErrorCode());
    }
}
