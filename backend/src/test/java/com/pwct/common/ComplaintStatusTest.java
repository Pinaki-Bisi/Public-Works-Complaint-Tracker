package com.pwct.common;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class ComplaintStatusTest {
    @Test
    void permitsOnlyDeclaredWorkflowTransitions() {
        assertTrue(ComplaintStatus.SUBMITTED.canTransitionTo(ComplaintStatus.ACKNOWLEDGED));
        assertTrue(ComplaintStatus.IN_PROGRESS.canTransitionTo(ComplaintStatus.RESOLVED));
        assertTrue(ComplaintStatus.CLOSED.canTransitionTo(ComplaintStatus.REOPENED));
        assertFalse(ComplaintStatus.SUBMITTED.canTransitionTo(ComplaintStatus.CLOSED));
        assertFalse(ComplaintStatus.REJECTED.canTransitionTo(ComplaintStatus.ASSIGNED));
    }
}
