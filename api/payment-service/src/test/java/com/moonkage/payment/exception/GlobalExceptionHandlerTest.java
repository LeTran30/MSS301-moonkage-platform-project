package com.moonkage.payment.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.moonkage.api.ApiResponse;
import com.moonkage.payment.config.LocaleConfig;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The error boundary of payment-service: its own business errors and the shared framework failures it inherits from
 * common-api. Every answer keeps the one body of Software Design 5.1 rule 8: {status, code, message, data: null,
 * path, timestamp}.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(new LocaleConfig().messageSource());
    }

    @Test
    void aBusinessErrorAnswersWithItsOwnCodeAndText() {
        AppException ex = new AppException(ErrorCode.PAYMENT_NOT_FOUND);

        ApiResponse<Void> body = handler.handleAppException(ex, request("GET", "/api/payments/pay-1"))
                .getBody();

        assertNotNull(body);
        assertEquals(404, body.status());
        assertEquals("PAYMENT_001", body.code());
        assertEquals("Không tìm thấy giao dịch thanh toán.", body.message());
        assertNull(body.data());
        assertEquals("/api/payments/pay-1", body.path());
        // a business error names no field: the whole request is wrong
        assertNull(body.errors());
    }

    @Test
    void aFieldThatIsNotValidIsABadRequestNamingEveryWrongField() {
        // getBindingResult() is final: mock-maker-subclass cannot stub it, so build a real exception
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "createPaymentRequest");
        bindingResult.addError(new FieldError("createPaymentRequest", "amount", "Số tiền không hợp lệ"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ApiResponse<Void> body = handler.handleValidationException(ex, request("POST", "/api/payments"))
                .getBody();

        assertNotNull(body);
        assertEquals(400, body.status());
        assertEquals("COMMON_400", body.code());
        assertEquals("Dữ liệu đầu vào không hợp lệ.", body.message());
        assertEquals(List.of(new ApiResponse.FieldError("amount", "Số tiền không hợp lệ")), body.errors());
    }

    @Test
    void aFailureNobodyExpectedIsAServerError() {
        ApiResponse<Void> body = handler.handleUncaughtException(
                        new RuntimeException("Unexpected error"), request("GET", "/api/payments/pay-1"))
                .getBody();

        assertNotNull(body);
        assertEquals(500, body.status());
        assertEquals("COMMON_500", body.code());
        assertEquals("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", body.message());
    }

    /** Through MVC dispatch: the catch-all handler must not turn these into 500. */
    @Test
    void unknownPathIs404AndWrongMethodIs405() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new PingController())
                .setControllerAdvice(handler)
                .build();

        mvc.perform(get("/unknown"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMON_404"));
        mvc.perform(delete("/ping"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("COMMON_405"));
    }

    private static MockHttpServletRequest request(String method, String path) {
        return new MockHttpServletRequest(method, path);
    }

    @RestController
    static class PingController {

        @GetMapping("/ping")
        String ping() {
            return "pong";
        }
    }
}
