package com.pwct.complaint.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssignRequest(
        @NotNull Long assigneeId,
        Instant scheduledAt,
        @Size(max = 500) String comment
) {
}
