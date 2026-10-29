package com.moonkage.identity.shared;

import java.time.ZoneId;

/** The time zone business dates are judged in, e.g. ID card expiry (AC-04.8). Instants stay in UTC. */
public final class VietnamTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private VietnamTime() {}
}
