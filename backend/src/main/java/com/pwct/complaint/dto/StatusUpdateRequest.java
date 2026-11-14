package com.pwct.complaint.dto;

import com.pwct.common.ComplaintStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusUpdateRequest(
        @NotNull ComplaintStatus status,
        @Size(max = 500) String comment
) {
}
