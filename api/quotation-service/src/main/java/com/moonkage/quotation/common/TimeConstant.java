package com.moonkage.quotation.common;

import java.time.ZoneId;

public final class TimeConstant {

    /** Business dates (delivery deadline, delivery date) are judged in Vietnam time. */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeConstant() {}
}
