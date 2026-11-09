package com.moonkage.order.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.moonkage.api.ApiResponse;
import com.moonkage.order.config.LocaleConfig;
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
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The error boundary of order-service: its own business errors and the shared framework failures it inherits from
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
        AppException ex = new AppException(ErrorCode.QUANTITY_OVER_STOCK, 3);

        ApiResponse<Void> body =
                handler.handleAppException(ex, request("GET", "/api/carts/me")).getBody();

        assertNotNull(body);
        assertEquals(409, body.status());
        assertEquals("CART_004", body.code());
        assertEquals("Chỉ còn 3 sản phẩm. Muốn mua nhiều hơn, hãy gửi yêu cầu đặt hàng cho Shop.", body.message());
        assertNull(body.data());
        assertEquals("/api/carts/me", body.path());
        // a business error names no field: the whole request is wrong
        assertNull(body.errors());
    }

    @Test
    void aMissingQueryParameterIsABadRequestNamingTheParameter() {
        var response = handler.handleMissingParameter(
                new MissingServletRequestParameterException("provinceCode", "String"), request("GET", "/api/carts/me"));

        assertEquals(400, response.getStatusCode().value());
        assertEquals(ErrorCode.PARAMETER_REQUIRED.getCode(), response.getBody().code());
        assertEquals("provinceCode", response.getBody().errors().getFirst().field());
    }

    @Test
    void aFieldThatIsNotValidIsABadRequestNamingEveryWrongField() {
        // getBindingResult() is final: mock-maker-subclass cannot stub it, so build a real exception
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "quoteRequest");
        bindingResult.addError(new FieldError("quoteRequest", "quantity", "Số lượng phải lớn hơn 0"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ApiResponse<Void> body = handler.handleValidationException(ex, request("POST", "/api/quote-requests"))
                .getBody();

        assertNotNull(body);
        assertEquals(400, body.status());
        assertEquals("COMMON_400", body.code());
        assertEquals("Dữ liệu đầu vào không hợp lệ.", body.message());
        assertEquals(List.of(new ApiResponse.FieldError("quantity", "Số lượng phải lớn hơn 0")), body.errors());
    }

    @Test
    void aFailureNobodyExpectedIsAServerError() {
        ApiResponse<Void> body = handler.handleUncaughtException(
                        new RuntimeException("Unexpected error"), request("GET", "/api/carts/me"))
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
