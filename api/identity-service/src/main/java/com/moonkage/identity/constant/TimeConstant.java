package com.moonkage.identity.constant;

import java.time.ZoneId;

public final class TimeConstant {

    /** Business dates are judged in Vietnam time, e.g. ID card expiry (AC-04.8). */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeConstant() {}
}
