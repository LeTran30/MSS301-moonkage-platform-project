-- BE-11: the W3C traceparent of the request that wrote the event. The relay publishes the event long
-- after the request is gone, so the trace travels with the row and the consumer continues the same trace.
ALTER TABLE outbox_events ADD COLUMN trace_parent varchar(55);