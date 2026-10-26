package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.dto.replay.ReplayCheckpoint;
import com.moonkage.catalog.dto.response.RebuildRatingsResponse;
import com.moonkage.catalog.dto.response.ReplayBatchResponse;
import com.moonkage.catalog.entity.projection.ProjectionRowValidation;
import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.repository.ProjectionRecoveryRepository;
import com.moonkage.catalog.service.CatalogProjectionService;
import com.moonkage.catalog.service.ProjectionRecoveryService;
import com.moonkage.catalog.service.ProjectionReplayEntryService;
import com.moonkage.catalog.service.replay.ProjectionReplayAdapter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectionRecoveryServiceImpl implements ProjectionRecoveryService {
    private static final int MAX_BATCH_SIZE = 1000;
    private final ProjectionRecoveryRepository repository;
    private final CatalogProjectionService projection;
    private final ProjectionReplayEntryService entryService;
    private final List<ProjectionReplayAdapter> adapters;

    @Override
    public ReplayBatchResponse replayPending(ReplayCheckpoint after, int limit) {
        requireLimit(limit);
        var candidates = repository.findPendingAfter(
                after == null ? null : after.receivedAt(), after == null ? null : after.eventId(), limit + 1);
        var batch = candidates.stream().limit(limit).toList();
        int applied = 0;
        int skipped = 0;
        int deferred = 0;
        for (var event : batch) {
            var matching = adapters.stream()
                    .filter(adapter -> event.routingKey().equals(adapter.routingKey()))
                    .toList();
            if (matching.size() > 1) {
                throw new IllegalStateException("Multiple replay adapters for " + event.routingKey());
            }
            if (matching.isEmpty()) {
                deferred++;
            } else if (entryService.replay(event.eventId(), matching.getFirst()) == ProjectionOutcome.APPLIED) {
                applied++;
            } else {
                skipped++;
            }
        }
        ReplayCheckpoint next = batch.isEmpty()
                ? after
                : new ReplayCheckpoint(
                        batch.getLast().receivedAt(), batch.getLast().eventId());
        return new ReplayBatchResponse(batch.size(), applied, skipped, deferred, next, candidates.size() > limit);
    }

    @Override
    public RebuildRatingsResponse rebuildRatings(String afterProductId, int limit) {
        requireLimit(limit);
        if (afterProductId != null) {
            ProjectionRowValidation.requireId(afterProductId);
        }
        var candidates = repository.findProductIdsAfter(afterProductId, limit + 1);
        var batch = candidates.stream().limit(limit).toList();
        for (String productId : batch) {
            projection.rebuildRating(productId);
        }
        return new RebuildRatingsResponse(
                batch.size(), batch.isEmpty() ? afterProductId : batch.getLast(), candidates.size() > limit);
    }

    private void requireLimit(int limit) {
        if (limit < 1 || limit > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("Recovery batch size must be between 1 and 1000");
        }
    }
}
