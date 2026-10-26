package com.moonkage.catalog.service;

public interface OutboxDeliveryService {
    /** False when empty or when delivery fails; the scheduler retries next tick. */
    boolean deliverNext();
}
