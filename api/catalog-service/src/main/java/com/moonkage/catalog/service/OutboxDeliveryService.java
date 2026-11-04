package com.moonkage.catalog.service;

public interface OutboxDeliveryService {
    /** False when empty or when delivery fails; the scheduler retries next tick. */
    boolean deliverNext();

    /** How many events are written but not published yet: the sign that the relay is stuck (BE-11b). */
    long countUnpublished();
}
