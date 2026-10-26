package com.moonkage.catalog.service;

import com.moonkage.catalog.enums.ProjectionOutcome;
import com.moonkage.catalog.service.replay.ProjectionReplayAdapter;

public interface ProjectionReplayEntryService {
    ProjectionOutcome replay(String eventId, ProjectionReplayAdapter adapter);
}
