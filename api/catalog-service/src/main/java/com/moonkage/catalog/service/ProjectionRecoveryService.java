package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.replay.ReplayCheckpoint;
import com.moonkage.catalog.dto.response.RebuildRatingsResponse;
import com.moonkage.catalog.dto.response.ReplayBatchResponse;

/** Operator/internal port; deliberately no controller, scheduler or fake producer feed. */
public interface ProjectionRecoveryService {
    ReplayBatchResponse replayPending(ReplayCheckpoint after, int limit);

    RebuildRatingsResponse rebuildRatings(String afterProductId, int limit);
}
