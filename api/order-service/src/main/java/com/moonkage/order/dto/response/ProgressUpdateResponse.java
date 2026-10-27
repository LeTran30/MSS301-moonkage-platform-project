package com.moonkage.order.dto.response;

import com.moonkage.order.enums.OrderStatus;
import java.time.Instant;
import java.util.List;

public record ProgressUpdateResponse(OrderStatus milestone, String note, List<String> photoKeys, Instant createdAt) {}
