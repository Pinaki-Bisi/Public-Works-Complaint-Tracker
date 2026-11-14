package com.pwct.common;

import java.util.Map;
import java.util.Set;

public enum ComplaintStatus {
    SUBMITTED,
    ACKNOWLEDGED,
    ASSIGNED,
    IN_PROGRESS,
    ON_HOLD,
    RESOLVED,
    CLOSED,
    REJECTED,
    REOPENED;

    private static final Map<ComplaintStatus, Set<ComplaintStatus>> ALLOWED = Map.of(
            SUBMITTED, Set.of(ACKNOWLEDGED, REJECTED),
            ACKNOWLEDGED, Set.of(ASSIGNED),
            ASSIGNED, Set.of(IN_PROGRESS),
            IN_PROGRESS, Set.of(ON_HOLD, RESOLVED),
            ON_HOLD, Set.of(IN_PROGRESS),
            RESOLVED, Set.of(CLOSED),
            CLOSED, Set.of(REOPENED),
            REOPENED, Set.of(ASSIGNED),
            REJECTED, Set.of()
    );

    public boolean canTransitionTo(ComplaintStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }
}
