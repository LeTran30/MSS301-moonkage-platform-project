package com.moonkage.identity.platform.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.platform.config.LocaleConfig;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.platform.web.validation.InvalidFields;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.CommonError;
import com.moonkage.identity.shared.error.LegacyError;
import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Errors use the one body of Software Design 5.1 rule 8: {status, code, message, data: null, path, timestamp}. */
class GlobalExceptionHandlerTest {

    private static final String PATH = "/identity-service/api/auth/register";

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        MessageSource messageSource = new LocaleConfig().messageSource();
        handler = new GlobalExceptionHandler(messageSource);
        LocaleContextHolder.setLocale(Locale.forLanguageTag("vi"));
        request = new MockHttpServletRequest("POST", PATH);
    }

    @Test
    void handleAppExceptionWithDynamicArgs() {
        AppException ex = new AppException(AccountError.NOT_FOUND, "acc-123");
        ResponseEntity<ApiResponse<Void>> response = handler.handleAppException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        ApiResponse<Void> body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.status());
        assertEquals("USER_001", body.code());
        assertEquals("Không tìm thấy tài khoản người dùng acc-123.", body.message());
        assertNull(body.data());
        assertEquals(PATH, body.path());
        assertNotNull(body.timestamp());
        assertNull(body.errors());
    }

    @Test
    void handleAppExceptionAccountNotActivated() {
        AppException ex = new AppException(LegacyError.ACCOUNT_NOT_ACTIVATED);
        ResponseEntity<ApiResponse<Void>> response = handler.handleAppException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("AUTH_002", response.getBody().code());
        assertEquals(
                "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và xác thực OTP.",
                response.getBody().message());
    }

    @Test
    void handleValidationException() {
        // getBindingResult() is final: mock-maker-subclass cannot stub it, so build a real exception
        BindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "accountCreateRequest");
        bindingResult.addError(new FieldError("accountCreateRequest", "email", "Email không đúng định dạng"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiResponse<Void> body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.status());
        assertEquals("COMMON_400", body.code());
        assertEquals("Dữ liệu đầu vào không hợp lệ.", body.message());
        assertEquals(List.of(new ApiResponse.FieldError("email", "Email không đúng định dạng")), body.errors());
    }

    @Test
    void invalidFieldsListEveryFieldWithItsMessage() {
        FieldParser parser = new FieldParser();
        parser.required(
                "recipientName", "validation.address.recipient_name", "n".repeat(101), raw -> Text.bounded(raw, 100));
        parser.required(
                "password",
                "validation.auth.password",
                Map.of(ValueRejected.Reason.REQUIRED, "validation.password.required"),
                " ",
                Text::required);
        InvalidFields ex = assertThrows(InvalidFields.class, parser::throwIfRejected);

        ResponseEntity<ApiResponse<Void>> response = handler.handleInvalidFields(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiResponse<Void> body = response.getBody();
        assertNotNull(body);
        assertEquals("COMMON_400", body.code());
        assertEquals("Dữ liệu đầu vào không hợp lệ.", body.message());
        // named placeholders are filled from the rejection's arguments; an override replaces the default key
        assertEquals(
                List.of(
                        new ApiResponse.FieldError("recipientName", "Tên người nhận tối đa 100 ký tự"),
                        new ApiResponse.FieldError("password", "Mật khẩu không được để trống")),
                body.errors());
    }

    @Test
    void parserWithoutRejectionsDoesNotThrow() {
        FieldParser parser = new FieldParser();
        assertEquals("Lan", parser.required("fullName", "validation.full_name", " Lan ", Text::required));
        assertNull(parser.optional("label", "validation.address.label", "  ", Text::required));
        parser.throwIfRejected();
    }

    @Test
    void handleUncaughtException() {
        Exception ex = new RuntimeException("Unexpected error");
        ResponseEntity<ApiResponse<Void>> response = handler.handleUncaughtException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("COMMON_500", response.getBody().code());
        assertEquals(
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                response.getBody().message());
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

    @RestController
    static class PingController {

        @GetMapping("/ping")
        String ping() {
            return "pong";
        }
    }

    @Test
    void successUsesTheSameBody() {
        ApiResponse<String> created = ApiResponse.created("payload");

        assertEquals(201, created.status());
        assertEquals(ApiResponse.SUCCESS_CODE, created.code());
        assertEquals(ApiResponse.SUCCESS_MESSAGE, created.message());
        assertEquals("payload", created.data());
        assertNull(created.path());
        assertNull(created.errors());
    }

    @Test
    void validationAndMalformedJsonHaveDifferentCodes() {
        // Q-11: one code, one meaning
        assertEquals("COMMON_400", CommonError.INVALID_INPUT.code());
        assertEquals("COMMON_400_JSON", CommonError.MALFORMED_JSON.code());
    }
}
