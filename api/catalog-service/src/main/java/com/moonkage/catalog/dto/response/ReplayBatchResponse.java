package com.moonkage.catalog.dto.response;

import com.moonkage.catalog.dto.replay.ReplayCheckpoint;

/**
 * One page of pending inbox events: deferred has no adapter for its key, failed was rejected by its adapter and stays
 * pending.
 */
public record ReplayBatchResponse(
        int inspected,
        int applied,
        int skipped,
        int deferred,
        int failed,
        ReplayCheckpoint nextScanPosition,
        boolean hasMore) {}
