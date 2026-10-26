package com.moonkage.payment.security;

import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import java.util.Arrays;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Builds {@link CurrentUserInfo} from {@link GatewayHeader}. Missing or unknown values mean the request did not come
 * through the gateway with a valid token, so the answer is 401 rather than a guess. A guest on an open endpoint sends
 * neither header and gets null; one header without the other is still 401.
 */
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(CurrentUserInfo.class);
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {
        String accountId = webRequest.getHeader(GatewayHeader.ACCOUNT_ID);
        String role = webRequest.getHeader(GatewayHeader.USER_ROLE);
        boolean required = parameter.getParameterAnnotation(CurrentUser.class).required();
        if (!required && accountId == null && role == null) {
            return null;
        }
        if (!StringUtils.hasText(accountId) || !isKnownRole(role)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return new CurrentUserInfo(accountId, Role.valueOf(role));
    }

    private static boolean isKnownRole(String role) {
        return role != null
                && Arrays.stream(Role.values()).anyMatch(r -> r.name().equals(role));
    }
}
