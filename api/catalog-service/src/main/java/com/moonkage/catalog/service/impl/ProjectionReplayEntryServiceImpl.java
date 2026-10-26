package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.exception.CatalogErrorCode;
import com.moonkage.catalog.exception.CatalogException;
import com.moonkage.catalog.repository.ProjectionRecoveryRepository;
import com.moonkage.catalog.service.ProjectionReplayEntryService;
import com.moonkage.catalog.service.replay.ProjectionReplayAdapter;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectionReplayEntryServiceImpl implements ProjectionReplayEntryService {
    private final ProjectionRecoveryRepository repository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ProjectionOutcome replay(String eventId, ProjectionReplayAdapter adapter) {
        Objects.requireNonNull(adapter);
        var event = repository
                .lockEntry(eventId)
                .orElseThrow(() -> new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT));
        if (!event.routingKey().equals(adapter.routingKey())) {
            throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
        }
        var existing = repository.findProcessedRoutingKey(eventId);
        if (existing.isPresent()) {
            requireMatchingMarker(existing.get(), event.routingKey());
            return ProjectionOutcome.DUPLICATE;
        }
        ProjectionOutcome outcome = Objects.requireNonNull(adapter.apply(event));
        // A no-op adapter must never cause a checkpoint to imply successful projection.
        String marker = repository
                .findProcessedRoutingKey(eventId)
                .orElseThrow(() -> new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT));
        requireMatchingMarker(marker, event.routingKey());
        return outcome;
    }

    private void requireMatchingMarker(String actual, String expected) {
        if (!actual.equals(expected)) {
            throw new CatalogException(CatalogErrorCode.PROJECTION_CONFLICT);
        }
    }
}
