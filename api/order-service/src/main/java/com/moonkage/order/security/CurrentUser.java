package com.moonkage.order.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a {@link CurrentUserInfo} controller parameter; a request without the gateway headers gets 401, or null when
 * the endpoint is open to guests ({@code required = false}).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {

    boolean required() default true;
}
