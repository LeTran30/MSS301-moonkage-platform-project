package com.moonkage.catalog.common;

import java.time.ZoneId;

public final class TimeConstant {

    /** Public availability and checkout snapshots use the product's Vietnam business date. */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeConstant() {}
}
