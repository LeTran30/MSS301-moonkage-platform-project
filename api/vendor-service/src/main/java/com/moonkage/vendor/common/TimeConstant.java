package com.moonkage.vendor.common;

import java.time.ZoneId;

public final class TimeConstant {

    /** Business dates, including a product's expiry date, are judged in Vietnam time. */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeConstant() {}
}
