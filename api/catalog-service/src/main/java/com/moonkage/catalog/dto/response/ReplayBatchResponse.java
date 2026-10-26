package com.moonkage.catalog.dto.response;

import com.moonkage.catalog.dto.replay.ReplayCheckpoint;

public record ReplayBatchResponse(
        int inspected, int applied, int skipped, int deferred, ReplayCheckpoint nextScanPosition, boolean hasMore) {}
